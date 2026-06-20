from rest_framework import serializers

from .models import ImagePost, Post, TextPost


class PostSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

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


class TextPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextPost
        fields = ["id", "post", "content"]


class ImagePostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImagePost
        fields = ["id", "post", "image", "description"]
