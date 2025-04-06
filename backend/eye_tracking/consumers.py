import logging
import time
import random
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

# Configure logger
logger = logging.getLogger("django")

# Constants for fixation tracking
GAZE_HISTORY_SIZE = 10
FIXATION_THRESHOLD = 40  # pixels
LOST_FOCUS_THRESHOLD = 3  # seconds
ALERT_COOLDOWN = 10  # seconds

ALERT_MESSAGES = [
    "Not fully engaged? Check out an alternative perspective for fresh insights!",
    "Your attention seems to drift—why not try a quick quiz?",
    "Looks like you're looking away. Explore alternative views to keep learning!",
]

def choose_alert_message():
    return random.choice(ALERT_MESSAGES)


class EyeTrackingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def eye_data(self, event):
        await self.send_json({"type": "eye.data", "payload": event["payload"]})

    async def eye_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

class GazeCollectorConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.gaze_history = []
        self.last_reading_timestamp = time.time()
        self.last_alert_time = 0

    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def receive_json(self, content):
        if content["type"] != "eye.data":
            return

        payload = content.get("payload", {})
        gaze_x = payload.get("gaze_x")
        gaze_y = payload.get("gaze_y")
        pupil_diameter = payload.get("pupil_diameter", 0.0)
        source = payload.get("source", "unknown")

        if gaze_x is None or gaze_y is None:
            logger.warning("❗ Invalid gaze data received: missing gaze_x or gaze_y.")
            return

        logger.info(f"📡 Received gaze data from '{source}': (x={gaze_x}, y={gaze_y}, pupil={pupil_diameter})")

        session = await self.get_active_session()
        if not session:
            logger.warning("⚠️ No active session found. Skipping gaze data processing.")
            return

        if session.end_time is not None:
            logger.warning(f"⚠️ Session {session.session_id} already ended. Skipping.")
            return

        await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter, source)

        # --- Fixation logic ---
        if self.detect_fixation(gaze_x, gaze_y):
            logger.debug("👁 Fixation detected. Resetting attention timer.")
        elif time.time() - self.last_reading_timestamp > LOST_FOCUS_THRESHOLD:
            if time.time() - self.last_alert_time > ALERT_COOLDOWN:
                msg = choose_alert_message()
                logger.warning(f"⚠️ Attention lost. Sending alert: {msg}")
                await self.channel_layer.group_send(
                    "eye_tracking",
                    {
                        "type": "eye.alert",
                        "message": msg,
                    },
                )
                self.last_alert_time = time.time()

        # Forward gaze data to all listeners (optional)
        await self.channel_layer.group_send(
            "eye_tracking",
            {
                "type": "eye.data",
                "payload": {
                    "gaze_x": gaze_x,
                    "gaze_y": gaze_y,
                    "pupil_diameter": pupil_diameter,
                    "source": source,
                },
            },
        )

    def detect_fixation(self, gaze_x, gaze_y):
        self.gaze_history.append((gaze_x, gaze_y, time.time()))
        if len(self.gaze_history) > GAZE_HISTORY_SIZE:
            prev_x, prev_y, _ = self.gaze_history[-GAZE_HISTORY_SIZE]
            distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5
            if distance < FIXATION_THRESHOLD:
                self.last_reading_timestamp = time.time()
                return True
        return False

    async def eye_data(self, event):
        await self.send_json({"type": "eye.data", "payload": event["payload"]})

    async def eye_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter, source):
        if session.end_time is not None:
            logger.warning(f"⚠️ Ignored gaze data for ended session: {session.session_id}")
            return  # Session already ended

        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter,
        )
        logger.info(f"💾 Gaze data from '{source}' saved (session={session.session_id})")