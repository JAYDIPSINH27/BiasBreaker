import json
from channels.generic.websocket import AsyncWebsocketConsumer

class EyeTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "eye_tracking"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def eye_alert(self, event):
        await self.send(text_data=json.dumps({
            "type": "eye.alert",
            "message": event.get("message", "User looking away!")
        }))

    async def eye_data(self, event):
        payload = {
            "gaze_x": event.get("gaze_x"),
            "gaze_y": event.get("gaze_y")
        }
        await self.send(text_data=json.dumps({
            "type": "eye.data",
            "payload": payload
        }))
