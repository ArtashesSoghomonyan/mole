from django.contrib.auth import get_user_model

from rest_framework import serializers

from apps.chat.models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "content", "sender", "sender_username", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=True,
        allow_empty=False,
        help_text="Ids of the other users to include in the conversation.",
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "participants",
            "participant_ids",
            "last_message",
            "created_at",
        ]

    def validate_participant_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        found = get_user_model().objects.filter(id__in=unique_ids).count()
        if found != len(unique_ids):
            raise serializers.ValidationError(
                "One or more participant ids do not exist."
            )
        return unique_ids

    def create(self, validated_data):
        participant_ids = validated_data.pop("participant_ids")
        conversation = Conversation.objects.create(**validated_data)
        conversation.participants.set(participant_ids)
        return conversation

    def get_participants(self, obj):
        return [
            {"id": p.id, "username": p.username}
            for p in obj.participants.all()
        ]

    def get_last_message(self, obj):
        last_message = (
            Message.objects
            .filter(conversation=obj)
            .order_by("-created_at")
            .first()
        )
        if last_message:
            return MessageSerializer(last_message).data
        return None
