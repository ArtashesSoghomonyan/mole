import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import DeletedUserEmail, Follow, FORBIDDEN_USERNAMES, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["avatar", "bio"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email", "first_name", "last_name", "profile"]


class SearchUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = get_user_model()
        fields = ["username", "first_name", "last_name", "profile"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, max_length=50)
    first_name = serializers.CharField(required=True, max_length=30)
    last_name = serializers.CharField(required=True, max_length=30)
    password = serializers.CharField(required=True)

    def validate_email(self, value):
        if get_user_model().objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        elif DeletedUserEmail.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email was deleted. You cannot use this email."
            )
        return value

    def validate_username(self, value):
        if get_user_model().objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        if not re.fullmatch(r"[a-z_]+", value):
            raise serializers.ValidationError(
                "Username must be lowercase letters or underscores only"
            )
        if value in FORBIDDEN_USERNAMES:
            raise serializers.ValidationError(
                "Username is not available"
            )
        return value

    def validate_first_name(self, value):
        return value.strip().capitalize()

    def validate_last_name(self, value):
        return value.strip().capitalize()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = get_user_model().objects.create_user(password=password, **validated_data)
        return user


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["id", "user_from", "user_to", "created_at"]
        read_only_fields = ["id", "user_from", "created_at"]

