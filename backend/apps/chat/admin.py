from django.contrib import admin

from apps.chat.models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_filter = ("participants", "created_at")
    list_display = ("id", "title", "created_at")
    search_fields = ("title", "participants")

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_filter = ("conversation", "sender", "created_at")
    list_display = ("id", "conversation", "sender", "content", "created_at")
    search_fields = ("conversation", "sender", "created_at")
