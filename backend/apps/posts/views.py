from django.shortcuts import get_object_or_404
from rest_framework import decorators, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .feed import get_scored_post_queryset
from .models import Comment, ImagePost, Post, PostLike, TextPost
from .serializers import CommentSerializer, PostSerializer, ReplySerializer


class FeedPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PostViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """View for listing current user's posts, not a recommendation"""
        queryset = Post.objects.filter(author=request.user)
        serializer = PostSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)
        serializer = PostSerializer(post, context={"request": request})
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

        serializer = PostSerializer(post, context={"request": request})
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

        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data)

    @decorators.action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)

        _, created = PostLike.objects.get_or_create(
            user=request.user,
            post=post,
        )

        if not created:
            return Response(
                {"detail": "You have already liked this post."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["delete"])
    def unlike(self, request, pk=None):
        post = get_object_or_404(Post, pk=pk)

        deleted, _ = PostLike.objects.filter(
            user=request.user,
            post=post,
        ).delete()

        if not deleted:
            return Response(
                {"detail": "You have not liked this post."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=False, methods=["get"])
    def feed(self, request):
        queryset = get_scored_post_queryset()
        paginator = FeedPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = PostSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

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


class CommentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        post_id = request.data.get("post")
        parent_id = request.data.get("parent")
        text = request.data.get("text")

        if post_id is None:
            return Response(
                {"detail": "post_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response(
                {"detail": f"post with id:{post_id} is not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parent = None
        if parent_id is not None:
            try:
                parent = Comment.objects.get(pk=parent_id)
            except Comment.DoesNotExist:
                return Response(
                    {"detail": f"comment with id:{parent_id} is not found"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not text:
            return Response(
                {"detail": "text of comment can't be blank"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = Comment.objects.create(
            author=request.user,
            post=post,
            parent=parent,
            text=text
        )

        serializer = CommentSerializer(comment)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def list(self, request):
        post_id = request.query_params.get("post")
        parent_id = request.query_params.get("parent")

        if not post_id:
            return Response(
                {"detail": "post query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response(
                {"detail": f"post with id:{post_id} is not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if parent_id is not None:
            # Return replies for a specific comment
            queryset = Comment.objects.filter(post=post_id, parent=parent_id)
            serializer = ReplySerializer(queryset, many=True)
        else:
            # Return top-level comments
            queryset = Comment.objects.filter(post=post_id, parent__isnull=True)
            serializer = CommentSerializer(queryset, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def retrieve(self, request, pk=None):
        comment = get_object_or_404(Comment, pk=pk)
        serializer = CommentSerializer(comment)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
