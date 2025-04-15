import logging
import time
import math
import random
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

logger = logging.getLogger("django")

# Constants for fixation tracking (optional, adjust as needed)
GAZE_HISTORY_SIZE = 10
FIXATION_THRESHOLD = 40  # pixels
LOST_FOCUS_THRESHOLD = 3  # seconds
ALERT_COOLDOWN = 4       # seconds

ALERT_MESSAGES = [
    "Not fully engaged? Take a moment to refocus and see new opportunities!",
    "Your attention seems to drift—try exploring fresh insights!",
    "Seems like you're looking away; re-engage for a deeper experience!",
]

def choose_alert_message():
    return random.choice(ALERT_MESSAGES)

class EyeTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumer for front-end connections.
    Receives broadcast messages and sends them immediately to the client.
    """
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        logger.info("Front-end client connected to EyeTrackingConsumer.")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)
        logger.info("Front-end client disconnected from EyeTrackingConsumer.")

    async def receive_json(self, content):
        # Process incoming messages if needed (typically front-end only receives broadcast)
        if content.get("type") == "eye.data":
            payload = content.get("payload", {})
            await self.channel_layer.group_send(
                "eye_tracking",
                {"type": "broadcast.gaze", "data": payload}
            )
        elif content.get("type") == "eye.alert":
            msg = content.get("message", "Attention alert!")
            await self.channel_layer.group_send(
                "eye_tracking",
                {"type": "broadcast.alert", "message": msg}
            )

    async def broadcast_gaze(self, event):
        # Immediately send gaze data to the client.
        await self.send_json({"type": "eye.data", "payload": event["data"]})

    async def broadcast_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})


class GazeCollectorConsumer(AsyncJsonWebsocketConsumer):
    """
    Consumer for receiving rapid gaze updates from your tracking source.
    Minimizes processing by immediately broadcasting data to clients
    and offloading any persistence or fixation logic to background tasks.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.gaze_history = []  # will store only the most recent samples
        self.last_reading_timestamp = time.time()
        self.last_alert_time = 0
        self.last_save_time = 0  # for throttling database saves

    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()
        logger.info("Tracking source connected to GazeCollectorConsumer.")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)
        logger.info("Tracking source disconnected from GazeCollectorConsumer.")

    async def receive_json(self, content):
        # Process only eye.data messages.
        if content.get("type") != "eye.data":
            return

        payload = content.get("payload", {})
        gaze_x = payload.get("gaze_x")
        gaze_y = payload.get("gaze_y")
        pupil_diameter = payload.get("pupil_diameter", 0.0)
        source = payload.get("source", "unknown")
        session_id = payload.get("session_id", "unknown")

        # Quick validation of data.
        if (
            gaze_x is None or 
            gaze_y is None or 
            (isinstance(gaze_x, float) and math.isnan(gaze_x)) or 
            (isinstance(gaze_y, float) and math.isnan(gaze_y))
        ):
            logger.warning("Invalid gaze data received. Skipping.")
            return

        # Immediately broadcast the gaze data to all clients.
        await self.channel_layer.group_send(
            "eye_tracking",
            {
                "type": "broadcast.gaze",
                "data": {
                    "gaze_x": gaze_x,
                    "gaze_y": gaze_y,
                    "pupil_diameter": pupil_diameter,
                    "source": source,
                    "session_id": session_id,
                },
            },
        )

        # Throttle database saves to no more than once every 0.1 seconds.
        now = time.time()
        if now - self.last_save_time >= 0.1:
            asyncio.create_task(self.async_save_gaze_data(gaze_x, gaze_y, pupil_diameter, source))
            self.last_save_time = now

        # Append the new data to gaze_history and trim the list.
        self.gaze_history.append((gaze_x, gaze_y, now))
        if len(self.gaze_history) > GAZE_HISTORY_SIZE:
            self.gaze_history = self.gaze_history[-GAZE_HISTORY_SIZE:]

        # Fixation detection.
        if self.detect_fixation(gaze_x, gaze_y):
            logger.debug("Fixation detected.")
        elif now - self.last_reading_timestamp > LOST_FOCUS_THRESHOLD:
            if now - self.last_alert_time > ALERT_COOLDOWN:
                alert_msg = choose_alert_message()
                logger.warning(f"Attention lost. Sending alert: {alert_msg}")
                await self.channel_layer.group_send(
                    "eye_tracking",
                    {"type": "broadcast.alert", "message": alert_msg},
                )
                self.last_alert_time = now

    def detect_fixation(self, gaze_x, gaze_y):
        # Use the oldest reading in the trimmed gaze_history as a comparison.
        if len(self.gaze_history) >= GAZE_HISTORY_SIZE:
            prev_x, prev_y, _ = self.gaze_history[0]
            distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5
            if distance < FIXATION_THRESHOLD:
                self.last_reading_timestamp = time.time()
                return True
        return False

    async def broadcast_gaze(self, event):
        # Safeguard method.
        await self.send_json({"type": "eye.data", "payload": event["data"]})

    async def broadcast_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    async def async_save_gaze_data(self, gaze_x, gaze_y, pupil_diameter, source):
        session = await self.get_active_session()
        if not session or session.end_time is not None:
            logger.warning("No active session or session ended. Skipping save.")
            return
        await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter)
        logger.info(f"Gaze data saved for session {session.session_id} from source '{source}'.")

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter,
        )
