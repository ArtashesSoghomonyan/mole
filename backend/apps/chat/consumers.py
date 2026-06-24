import json

from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]

        self.room_group_name = (
            f"chat_{self.conversation_id}"
        )

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def receive(self, text_data):
        data = json.loads(text_data)

        message = data["message"]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
            }
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps({
                "message": event["message"]
            })
        )
