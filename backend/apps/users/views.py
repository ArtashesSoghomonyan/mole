from django.contrib.auth import get_user_model, login, logout
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import DeletedUserEmail
from .permissions import IsAnonymous
from .serializers import RegisterSerializer, UserSerializer


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
        result = UserSerializer(user).data
        return Response(result, status=status.HTTP_201_CREATED)


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
