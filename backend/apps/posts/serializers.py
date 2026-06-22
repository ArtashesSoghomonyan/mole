from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Comment, ImagePost, Post, TextPost
from apps.users.serializers import SearchUserSerializer


class PostSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    author = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "post_type",
            "content",
            "created_at",
            "updated_at",
        ]

    def get_content(self, obj):
        if obj.post_type == "text":
            return TextPostSerializer(
                obj.text_content
            ).data

        if obj.post_type == "image":
            return ImagePostSerializer(
                obj.image_content
            ).data

    def get_author(self, obj):
        return SearchUserSerializer(obj.author, context=self.context).data


class TextPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextPost
        fields = ["id", "post", "content"]


class ImagePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagePost
        fields = ["id", "post", "image", "description"]


class ReplySerializer(serializers.ModelSerializer):
    author = SearchUserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "text",
            "created_at",
        ]


class CommentSerializer(serializers.ModelSerializer):
    author = SearchUserSerializer(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "text",
            "created_at",
            "replies",
        ]
