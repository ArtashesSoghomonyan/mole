from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ImagePost, Post, TextPost
from .serializers import ImagePostSerializer, PostSerializer, TextPostSerializer


class PostViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """View for listing current user's posts, not a recommendation"""
        queryset = Post.objects.filter(author=request.user)
        serializer = PostSerializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        post_type = request.data.get("post_type")

        if post_type not in ("text", "image"):
            return Response(
                {"post_type": 'Must be either "text" or "image".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post = Post.objects.create(
            author=request.user,
            post_type=post_type,
        )

        if post_type == "text":
            content = request.data.get("content")
            if not content:
                post.delete()
                return Response(
                    {"content": "This field is required for text posts."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            TextPost.objects.create(post=post, content=content)

        elif post_type == "image":
            image = request.FILES.get("image")
            description = request.data.get("description", "")

            if not image:
                post.delete()
                return Response(
                    {"image": "This field is required for image posts."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ImagePost.objects.create(post=post, image=image, description=description)

        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)

        if post.author != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if post.post_type == "text":
            content = request.data.get("content")
            if content is not None:
                post.text_content.content = content
                post.text_content.save()
        elif post.post_type == "image":
            description = request.data.get("description")
            if description is not None:
                post.image_content.description = description

            if description is not None:
                post.image_content.save()

        post.save()

        serializer = PostSerializer(post)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)

        if post.author != request.user:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        post.delete()

        return Response(
            {"detail": "Deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )
