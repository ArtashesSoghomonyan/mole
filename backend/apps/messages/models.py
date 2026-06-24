from django.contrib.auth import get_user_model
from django.db import models


class Conversation(models.Model):
    title = models.CharField(max_length=300)
    participants = models.ManyToManyField(get_user_model(), related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.content[:50]

    class Meta:
        ordering = ["-created_at"]
