from rest_framework import viewsets
from rest_framework.response import Response

from .models import ImagePost, Post, TextPost
from .serializers import ImagePostSerializer, PostSerializer, TextPostSerializer


class PostViewSet(viewsets.ViewSet):
    def list(self, request):
        queryset = Post.objects.all()
        serializer = PostSerializer(queryset, many=True)
        return Response(serializer.data)
