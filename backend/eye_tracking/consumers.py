# consumers.py (Fully Corrected)
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .models import EyeTrackingSession, GazeData
from channels.db import database_sync_to_async
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

    async def receive_json(self, content):
        if content['type'] == "eye.data":
            gaze_x = content['payload']['gaze_x']
            gaze_y = content['payload']['gaze_y']
            pupil_diameter = content['payload'].get('pupil_diameter', 0.0)
            session = await self.get_active_session()
            if session:
                await self.save_gaze_data(session, gaze_x, gaze_y, pupil_diameter)

            # Forward gaze data to frontend immediately
            await self.channel_layer.group_send(
                "eye_tracking",
                {"type": "eye.data", "payload": {"gaze_x": gaze_x, "gaze_y": gaze_y}}
            )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    @database_sync_to_async
    def get_active_session(self):
        return EyeTrackingSession.objects.filter(end_time__isnull=True).order_by('-start_time').first()

    @database_sync_to_async
    def save_gaze_data(self, session, gaze_x, gaze_y, pupil_diameter):
        GazeData.objects.create(
            session=session,
            gaze_x=gaze_x,
            gaze_y=gaze_y,
            pupil_diameter=pupil_diameter
        )