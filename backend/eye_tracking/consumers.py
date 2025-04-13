import logging
import time
import random
import math
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

logger = logging.getLogger("django")

# Constants for fixation tracking
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
        if content.get("type") != "eye.data":
            return

        payload = content.get("payload", {})
        gaze_x = payload.get("gaze_x")
        gaze_y = payload.get("gaze_y")
        pupil_diameter = payload.get("pupil_diameter", 0.0)
        source = payload.get("source", "unknown")
        session_id = payload.get("session_id", "unknown")

        # Validate gaze data
        if (
            gaze_x is None or 
            gaze_y is None or 
            (isinstance(gaze_x, float) and math.isnan(gaze_x)) or 
            (isinstance(gaze_y, float) and math.isnan(gaze_y))
        ):
            logger.warning("❗ Invalid gaze data received: gaze_x or gaze_y is None or NaN.")
            return

        logger.info(f"📡 Received gaze data from '{source}' (Session: {session_id}): (x={gaze_x}, y={gaze_y}, pupil={pupil_diameter})")

        # Immediately forward gaze data to frontend
        await self.channel_layer.group_send(
            "eye_tracking",
            {
                "type": "eye.data",
                "payload": {
                    "gaze_x": gaze_x,
                    "gaze_y": gaze_y,
                    "pupil_diameter": pupil_diameter,
                    "source": source,
                    "session_id": session_id,
                },
            },
        )

        # Save gaze data in the background without delaying response
        asyncio.create_task(self.async_save_gaze_data(gaze_x, gaze_y, pupil_diameter, source))

        # --- Fixation logic ---
        if self.detect_fixation(gaze_x, gaze_y):
            logger.debug("👁 Fixation detected. Attention maintained.")
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

    def detect_fixation(self, gaze_x, gaze_y):
        current_time = time.time()
        self.gaze_history.append((gaze_x, gaze_y, current_time))
        if len(self.gaze_history) > GAZE_HISTORY_SIZE:
            # Compare current reading with the one GAZE_HISTORY_SIZE steps ago
            prev_x, prev_y, _ = self.gaze_history[-GAZE_HISTORY_SIZE]
            distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5
            if distance < FIXATION_THRESHOLD:
                self.last_reading_timestamp = current_time
                return True
        return False

    async def eye_data(self, event):
        await self.send_json({"type": "eye.data", "payload": event["payload"]})

    async def eye_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    async def async_save_gaze_data(self, gaze_x, gaze_y, pupil_diameter, source):
        session = await self.get_active_session()
        if not session:
            logger.warning("⚠️ No active session found. Skipping gaze data saving.")
            return
        if session.end_time is not None:
            logger.warning(f"⚠️ Session {session.session_id} already ended. Skipping saving gaze data.")
            return
        await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter)
        logger.info(f"💾 Gaze data saved for session {session.session_id} from source '{source}'.")

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter,
        )
