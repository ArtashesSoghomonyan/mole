from django.contrib.auth import get_user_model, login, logout
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import DeletedUserEmail, Follow, Profile
from .permissions import IsAnonymous
from .serializers import (
    FollowSerializer,
    ProfileSerializer,
    RegisterSerializer,
    SearchUserSerializer,
    UserSerializer,
)


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        user = get_object_or_404(get_user_model(), username=username)
        serializer = SearchUserSerializer(user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class BrowserCompatibleTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        # Log the user into the Django session
        login(request, serializer.user)


        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [IsAnonymous]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        Profile.objects.create(user=user)
        result = UserSerializer(user).data
        return Response(result, status=status.HTTP_201_CREATED)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def patch(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class CheckUsernameView(APIView):
    def get(self, request):
        username = request.query_params.get("username")

        if get_user_model().objects.filter(username=username).exists():
            return Response({
                "available": False,
            })
        return Response({
            "available": True,
        })


class CheckEmailView(APIView):
    def get(self, request):
        email = request.query_params.get("email")

        if get_user_model().objects.filter(email=email).exists() or \
            DeletedUserEmail.objects.filter(email=email).exists():
            return Response({
                "available": False,
            })
        return Response({
            "available": True,
        })


class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        """Follow a user"""
        target_user = get_object_or_404(get_user_model(), username=username)

        if target_user == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        follow, created = Follow.objects.get_or_create(
            user_from=request.user,
            user_to=target_user,
        )

        if not created:
            return Response(
                {"detail": f"You are already following {username}."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = FollowSerializer(follow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, username):
        """Unfollow a user"""
        target_user = get_object_or_404(get_user_model(), username=username)

        deleted, _ = Follow.objects.filter(
            user_from=request.user,
            user_to=target_user,
        ).delete()

        if not deleted:
            return Response(
                {"detail": f"You are not following {username}."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSearchView(generics.ListAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = SearchUserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "profile__bio"]
