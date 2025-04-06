import logging
import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

# Configure logger
logger = logging.getLogger("django")

# Fixation Tracking Variables
gaze_history = []
GAZE_HISTORY_SIZE = 10
FIXATION_THRESHOLD = 40  # pixels (adjustable for 1920x1080)
LOST_FOCUS_THRESHOLD = 3  # seconds
ALERT_COOLDOWN = 10  # seconds
last_reading_timestamp = time.time()
last_alert_time = 0

ALERT_MESSAGES = [
    "Not fully engaged? Check out an alternative perspective for fresh insights!",
    "Your attention seems to drift—why not try a quick quiz?",
    "Looks like you're looking away. Explore alternative views to keep learning!",
]


def choose_alert_message():
    import random
    return random.choice(ALERT_MESSAGES)


def detect_fixation(gaze_x, gaze_y):
    global gaze_history, last_reading_timestamp

    gaze_history.append((gaze_x, gaze_y, time.time()))
    if len(gaze_history) > GAZE_HISTORY_SIZE:
        prev_x, prev_y, _ = gaze_history[-GAZE_HISTORY_SIZE]
        distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5

        if distance < FIXATION_THRESHOLD:
            last_reading_timestamp = time.time()
            return True
    return False


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
    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def receive_json(self, content):
        if content["type"] != "eye.data":
            return

        payload = content["payload"]
        gaze_x = payload["gaze_x"]
        gaze_y = payload["gaze_y"]
        pupil_diameter = payload.get("pupil_diameter", 0.0)
        source = payload.get("source", "unknown")

        # Log the data
        logger.info(f"Received gaze data from '{source}': (x={gaze_x}, y={gaze_y}, pupil={pupil_diameter})")

        session = await self.get_active_session()
        if session:
            await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter, source)

        # Fixation detection (for both tobii and webcam)
        global last_alert_time
        if detect_fixation(gaze_x, gaze_y):
            logger.debug("Fixation detected. Resetting attention timer.")
        elif time.time() - last_reading_timestamp > LOST_FOCUS_THRESHOLD:
            if time.time() - last_alert_time > ALERT_COOLDOWN:
                msg = choose_alert_message()
                logger.warning(f"Attention lost. Sending alert: {msg}")
                await self.channel_layer.group_send(
                    "eye_tracking",
                    {
                        "type": "eye.alert",
                        "message": msg,
                    },
                )
                last_alert_time = time.time()

        # Forward Tobii gaze to frontend
        if source == "tobii":
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

    async def eye_data(self, event):
        await self.send_json({"type": "eye.data", "payload": event["payload"]})

    async def eye_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter, source):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter,
        )
        logger.info(f"Gaze data from '{source}' stored successfully (session={session.session_id}).")
