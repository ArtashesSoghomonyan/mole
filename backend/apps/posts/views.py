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
