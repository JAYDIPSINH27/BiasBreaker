# consumers.py
import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import EyeTrackingSession, GazeData

class EyeTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    Sends real-time gaze updates + potential alerts to connected frontends
    in the 'eye_tracking' group.
    """
    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def eye_data(self, event):
        # event["payload"] = {gaze_x, gaze_y, source}
        await self.send_json({"type": "eye.data", "payload": event["payload"]})

    async def eye_alert(self, event):
        # event["message"] = alert message
        await self.send_json({"type": "eye.alert", "message": event["message"]})


class GazeCollectorConsumer(AsyncJsonWebsocketConsumer):
    """
    Receives data from local Tobii Python script or from the frontend webcam script,
    then saves to DB and broadcasts to 'eye_tracking' group.
    """
    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def receive_json(self, content):
        # Expecting format: { "type": "eye.data", "payload": { gaze_x, gaze_y, [pupil_diameter], source } }
        if content.get("type") == "eye.data":
            payload = content["payload"]
            gaze_x = payload["gaze_x"]
            gaze_y = payload["gaze_y"]
            pupil_diameter = payload.get("pupil_diameter", 0.0)
            source = payload.get("source", "unknown")

            # Save to the most recent active session if it exists
            session = await self.get_active_session()
            if session:
                await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter)

            # Forward the data to the eye_tracking group for frontends to display
            await self.channel_layer.group_send(
                "eye_tracking",
                {
                    "type": "eye.data",
                    "payload": {"gaze_x": gaze_x, "gaze_y": gaze_y, "source": source},
                }
            )

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by("-start_time").first()

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter
        )
