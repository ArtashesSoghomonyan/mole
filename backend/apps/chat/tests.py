import asyncio

from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from apps.chat.models import Conversation, Message

from config.asgi import application

User = get_user_model()

IN_MEMORY_CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}
}


def create_user(email, username):
    return User.objects.create_user(
        email=email,
        username=username,
        first_name=username.capitalize(),
        last_name="Test",
        password="testpassword123",
    )


class ConversationAPITests(APITestCase):
    def setUp(self):
        self.alice = create_user("alice@example.com", "alice")
        self.bob = create_user("bob@example.com", "bob")
        self.carol = create_user("carol@example.com", "carol")

        self.conversation = Conversation.objects.create(title=None)
        self.conversation.participants.add(self.alice, self.bob)
        Message.objects.create(
            conversation=self.conversation, sender=self.alice, content="first"
        )
        Message.objects.create(
            conversation=self.conversation, sender=self.bob, content="second"
        )

    def test_list_returns_only_own_conversations(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get("/api/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.conversation.id)

    def test_list_excludes_conversations_of_others(self):
        self.client.force_authenticate(user=self.carol)
        response = self.client.get("/api/chat/conversations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_messages_are_oldest_first(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(
            f"/api/chat/conversations/{self.conversation.id}/messages/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [message["content"] for message in response.data],
            ["first", "second"],
        )

    def test_non_participant_cannot_read_messages(self):
        self.client.force_authenticate(user=self.carol)
        response = self.client.get(
            f"/api/chat/conversations/{self.conversation.id}/messages/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_dm_conversation(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [self.carol.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        conversation = Conversation.objects.get(id=response.data["id"])
        self.assertEqual(
            set(conversation.participants.values_list("id", flat=True)),
            {self.alice.id, self.carol.id},
        )

    def test_create_group_conversation(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [self.bob.id, self.carol.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        conversation = Conversation.objects.get(id=response.data["id"])
        self.assertEqual(
            set(conversation.participants.values_list("id", flat=True)),
            {self.alice.id, self.bob.id, self.carol.id},
        )

    def test_dm_dedupe_returns_existing_conversation(self):
        self.client.force_authenticate(user=self.alice)
        first = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [self.carol.id]},
            format="json",
        )
        second = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [self.carol.id]},
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["id"], second.data["id"])

    def test_create_requires_an_other_participant(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [self.alice.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_with_unknown_participant_fails(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": [999999]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_requires_non_empty_participant_ids(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.post(
            "/api/chat/conversations/",
            {"participant_ids": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(CHANNEL_LAYERS=IN_MEMORY_CHANNEL_LAYERS)
class MessageDeletionTests(APITestCase):
    def setUp(self):
        self.alice = create_user("alice@example.com", "alice")
        self.bob = create_user("bob@example.com", "bob")
        self.conversation = Conversation.objects.create(title=None)
        self.conversation.participants.add(self.alice, self.bob)
        self.message = Message.objects.create(
            conversation=self.conversation, sender=self.alice, content="delete me"
        )

    def test_delete_own_message(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.delete(
            f"/api/chat/conversations/{self.conversation.id}/messages/{self.message.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Message.objects.filter(id=self.message.id).exists())

    def test_cannot_delete_others_message(self):
        self.client.force_authenticate(user=self.bob)
        response = self.client.delete(
            f"/api/chat/conversations/{self.conversation.id}/messages/{self.message.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Message.objects.filter(id=self.message.id).exists())

    def test_cannot_delete_message_outside_own_conversations(self):
        carol = create_user("carol@example.com", "carol")
        self.client.force_authenticate(user=carol)
        response = self.client.delete(
            f"/api/chat/conversations/{self.conversation.id}/messages/{self.message.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(CHANNEL_LAYERS=IN_MEMORY_CHANNEL_LAYERS)
class ChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.alice = create_user("alice@example.com", "alice")
        self.bob = create_user("bob@example.com", "bob")
        self.carol = create_user("carol@example.com", "carol")
        self.conversation = Conversation.objects.create(title=None)
        self.conversation.participants.add(self.alice, self.bob)

    def test_participant_can_send_and_receive_messages(self):
        token = AccessToken.for_user(self.alice)

        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/chat/{self.conversation.id}/?token={token}"
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.send_json_to({"message": "hello"})
            response = await communicator.receive_json_from(timeout=5)
            await communicator.disconnect()
            return response

        response = asyncio.run(scenario())

        self.assertEqual(response["type"], "chat_message")
        self.assertEqual(response["message"], "hello")
        self.assertEqual(response["sender_username"], "alice")
        self.assertIn("created_at", response)
        self.assertTrue(
            Message.objects.filter(
                conversation=self.conversation,
                sender=self.alice,
                content="hello",
            ).exists()
        )

    def test_empty_message_is_rejected(self):
        token = AccessToken.for_user(self.alice)

        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/chat/{self.conversation.id}/?token={token}"
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.send_json_to({"message": "   "})
            response = await communicator.receive_json_from(timeout=5)
            await communicator.disconnect()
            return response

        response = asyncio.run(scenario())

        self.assertEqual(response["type"], "error")
        self.assertFalse(
            Message.objects.filter(conversation=self.conversation).exists()
        )

    def test_malformed_json_is_rejected(self):
        token = AccessToken.for_user(self.alice)

        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/chat/{self.conversation.id}/?token={token}"
            )
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.send_to(text_data="this is not json {")
            response = await communicator.receive_json_from(timeout=5)
            await communicator.disconnect()
            return response

        response = asyncio.run(scenario())

        self.assertEqual(response["type"], "error")

    def test_non_participant_connection_is_closed(self):
        token = AccessToken.for_user(self.carol)

        async def scenario():
            communicator = WebsocketCommunicator(
                application, f"/ws/chat/{self.conversation.id}/?token={token}"
            )
            connected, _ = await communicator.connect()
            return connected

        connected = asyncio.run(scenario())
        self.assertFalse(connected)

