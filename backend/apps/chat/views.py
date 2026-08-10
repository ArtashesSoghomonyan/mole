from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.chat.models import Conversation, Message
from apps.chat.serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        # Users only ever see their own conversations
        return Conversation.objects.filter(participants=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # The requester is always a participant, so consider only the others.
        participant_ids = [
            uid
            for uid in serializer.validated_data["participant_ids"]
            if uid != request.user.id
        ]
        participant_ids = list(dict.fromkeys(participant_ids))

        if not participant_ids:
            return Response(
                {"detail": "At least one other participant is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Avoid duplicate conversations with the exact same set of people.
        existing = self.find_conversation_with_exact_participants(
            request.user, participant_ids
        )
        if existing is not None:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer.save()
        serializer.instance.participants.add(request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def find_conversation_with_exact_participants(self, user, participant_ids):
        """Return an existing conversation with exactly this set of participants."""
        target_ids = sorted({user.id, *participant_ids})

        return (
            Conversation.objects
            .filter(participants__id__in=target_ids)
            .annotate(
                required_present=Count(
                    "participants",
                    filter=Q(participants__id__in=target_ids),
                    distinct=True,
                ),
                num_participants=Count("participants", distinct=True),
            )
            .filter(required_present=len(target_ids))
            .filter(num_participants=len(target_ids))
            .first()
        )

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = Message.objects.filter(
            conversation=conversation
        ).order_by("created_at")  # oldest first, for a chat UI
        return Response(MessageSerializer(messages, many=True).data)

    @action(detail=True, methods=["delete"], url_path=r"messages/(?P<message_id>\d+)")
    def delete_message(self, request, pk=None, message_id=None):
        conversation = self.get_object()
        message = get_object_or_404(
            Message,
            id=message_id,
            conversation=conversation,
            sender=request.user,  # only your own messages
        )
        message.delete()
        # Tell connected clients in real time
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation.id}",
            {"type": "chat_message_deleted", "message_id": message.id},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

