# consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class EyeTrackingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("eye_tracking", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("eye_tracking", self.channel_name)

    async def eye_data(self, event):
        # event contains "payload": {"gaze_x": value, "gaze_y": value}
        payload = event.get("payload", {})
        await self.send_json({
            "type": "eye.data",
            "payload": payload
        })

    async def eye_alert(self, event):
        message = event.get("message", "User looking away!")
        await self.send_json({
            "type": "eye.alert",
            "message": message
        })
