import logging
import time
import math
import random
import asyncio
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

logger = logging.getLogger("django")

GAZE_HISTORY_SIZE = 50
FIXATION_THRESHOLD = 40
LOST_FOCUS_THRESHOLD = 3
ALERT_COOLDOWN = 4

ALERT_MESSAGES = [
    "Not fully engaged? Take a moment to refocus and see new opportunities!",
    "Your attention seems to drift—try exploring fresh insights!",
    "Seems like you're looking away; re-engage for a deeper experience!",
]

def choose_alert_message():
    return random.choice(ALERT_MESSAGES)

class EyeTrackingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        logger.info("Front-end client connected to EyeTrackingConsumer.")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)
        logger.info("Front-end client disconnected from EyeTrackingConsumer.")

    async def receive_json(self, content):
        if content.get("type") == "eye.data":
            payload = content.get("payload", {})
            await self.channel_layer.group_send(
                "eye_tracking", {"type": "broadcast.gaze", "data": payload}
            )
        elif content.get("type") == "eye.alert":
            msg = content.get("message", "Attention alert!")
            await self.channel_layer.group_send(
                "eye_tracking", {"type": "broadcast.alert", "message": msg}
            )

    async def broadcast_gaze(self, event):
        await self.send_json({"type": "eye.data", "payload": event["data"]})

    async def broadcast_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})


class GazeCollectorConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.latest_gaze = None
        self.last_broadcasted_gaze = None
        self.gaze_history = []
        self.last_reading_timestamp = time.time()
        self.last_alert_time = 0
        self.last_save_time = 0
        self.broadcast_interval = 0.05
        self.save_queue = asyncio.Queue(maxsize=200)
        self.save_workers = []

    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()
        logger.info("Tracking source connected to GazeCollectorConsumer.")
        self.loop_task = asyncio.create_task(self.periodic_broadcast())
        for _ in range(3):
            worker = asyncio.create_task(self.save_worker())
            self.save_workers.append(worker)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)
        if hasattr(self, "loop_task"):
            self.loop_task.cancel()
            try: await self.loop_task
            except asyncio.CancelledError: pass
        for worker in self.save_workers:
            worker.cancel()
            try: await worker
            except asyncio.CancelledError: pass
        logger.info("Tracking source disconnected.")

    async def periodic_broadcast(self):
        while True:
            await asyncio.sleep(self.broadcast_interval)
            if self.latest_gaze and self.latest_gaze != self.last_broadcasted_gaze:
                await self.channel_layer.group_send(
                    "eye_tracking", {"type": "broadcast.gaze", "data": self.latest_gaze}
                )
                self.last_broadcasted_gaze = self.latest_gaze

    async def receive_json(self, content):
        if content.get("type") != "eye.data":
            return

        payload = content.get("payload", {})
        gaze_x = payload.get("gaze_x")
        gaze_y = payload.get("gaze_y")
        pupil_diameter = payload.get("pupil_diameter", 0.0)
        source = payload.get("source", "unknown")
        session_id = payload.get("session_id", "unknown")

        if (
            gaze_x is None or gaze_y is None or
            (isinstance(gaze_x, float) and math.isnan(gaze_x)) or
            (isinstance(gaze_y, float) and math.isnan(gaze_y))
        ):
            logger.warning("Invalid gaze data received.")
            return

        self.latest_gaze = {
            "gaze_x": gaze_x,
            "gaze_y": gaze_y,
            "pupil_diameter": pupil_diameter,
            "source": source,
            "session_id": session_id,
        }

        now = time.time()
        if now - self.last_save_time >= 0.1 and not self.save_queue.full():
            await self.save_queue.put((gaze_x, gaze_y, pupil_diameter, source))
            self.last_save_time = now

        self.gaze_history.append((gaze_x, gaze_y, now))
        self.gaze_history = self.gaze_history[-GAZE_HISTORY_SIZE:]

        if self.detect_fixation(gaze_x, gaze_y):
            logger.debug("Fixation detected.")
        elif now - self.last_reading_timestamp > LOST_FOCUS_THRESHOLD:
            if now - self.last_alert_time > ALERT_COOLDOWN:
                msg = choose_alert_message()
                logger.warning(f"Attention lost: {msg}")
                await self.channel_layer.group_send(
                    "eye_tracking", {"type": "broadcast.alert", "message": msg}
                )
                self.last_alert_time = now

    def detect_fixation(self, gaze_x, gaze_y):
        if len(self.gaze_history) >= GAZE_HISTORY_SIZE:
            prev_x, prev_y, _ = self.gaze_history[0]
            distance = ((gaze_x - prev_x) ** 2 + (gaze_y - prev_y) ** 2) ** 0.5
            if distance < FIXATION_THRESHOLD:
                self.last_reading_timestamp = time.time()
                return True
        return False

    async def broadcast_gaze(self, event):
        await self.send_json({"type": "eye.data", "payload": event["data"]})

    async def broadcast_alert(self, event):
        await self.send_json({"type": "eye.alert", "message": event["message"]})

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    async def async_save_gaze_data(self, gaze_x, gaze_y, pupil_diameter, source):
        session = await self.get_active_session()
        if not session or session.end_time:
            return
        await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter)

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter,
        )

    async def save_worker(self):
        while True:
            gaze_data = await self.save_queue.get()
            try:
                await self.async_save_gaze_data(*gaze_data)
            except Exception as e:
                logger.exception(f"Error saving gaze data: {e}")
            finally:
                self.save_queue.task_done()
