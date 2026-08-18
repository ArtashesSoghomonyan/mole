import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.chat.models import Conversation, Message

MAX_MESSAGE_LENGTH = 2000


def format_datetime(value):
    """Format a datetime like DRF does: UTC ISO-8601 with a trailing 'Z'."""
    return value.isoformat().replace("+00:00", "Z")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]

        # Check if the user is a participant of this conversation
        if not await self.is_participant(self.user, self.conversation_id):
            await self.close()
            return

        self.room_group_name = f"chat_{self.conversation_id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )

        await self.accept()

    @database_sync_to_async
    def is_participant(self, user, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return conversation.participants.filter(id=user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, conversation_id, sender, content):
        return Message.objects.create(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
        )

    async def receive(self, text_data=None, bytes_data=None):
        if text_data is None:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON payload.")
            return

        content = str(data.get("message", "")).strip()

        if not content:
            await self.send_error("Message cannot be empty.")
            return

        if len(content) > MAX_MESSAGE_LENGTH:
            content = content[:MAX_MESSAGE_LENGTH]

        # Save the message to the database
        message = await self.save_message(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=content,
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": content,
                "sender_id": self.user.id,
                "sender_username": self.user.username,
                "message_id": message.id,
                "created_at": format_datetime(message.created_at),
            },
        )

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "chat_message",
                "message": event["message"],
                "sender_id": event["sender_id"],
                "sender_username": event["sender_username"],
                "message_id": event["message_id"],
                "created_at": event["created_at"],
            })
        )

    async def chat_message_deleted(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "chat_message_deleted",
                "message_id": int(event["message_id"]),
            })
        )

    async def send_error(self, detail):
        await self.send(
            text_data=json.dumps({
                "type": "error",
                "detail": detail,
            })
        )
