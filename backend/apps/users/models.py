import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db import models


FORBIDDEN_USERNAMES = [
    "register",
    "profile",
    "messages",
]

def validate_username_not_forbidden(value):
    if value.lower() in FORBIDDEN_USERNAMES:
        raise ValidationError(
            "This username is not allowed.",
            code="forbidden_username",
        )


def deleted_email_validator(value: str):
    if DeletedUserEmail.objects.filter(email=value).exists():
        raise ValidationError(
            "This email cannot be used, because it has been used before."
        )


class DeletedUserEmail(models.Model):
    email = models.EmailField(unique=True)
    deleted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class User(AbstractUser):
    username = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(r"^[a-z_]+$"),
            MinLengthValidator(1),
            MaxLengthValidator(50),
            validate_username_not_forbidden
        ],
        db_index=True,
    )
    email = models.EmailField(
        unique=True,
        validators=[deleted_email_validator]
    )
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    @property
    def followers_count(self):
        return self.follower_set.count()

    @property
    def following_count(self):
        return self.following_set.count()

    def __str__(self) -> str:
        return f"{self.username} - {self.email}"


def avatar_upload_path(instance, filename):
    extension = filename.split(".")[-1]
    return f"avatars/{uuid.uuid4()}.{extension}"


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    avatar = models.ImageField(
        upload_to=avatar_upload_path, null=True, blank=True,
    )
    bio = models.TextField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.user.username}'s profile"


class Follow(models.Model):
    user_from = models.ForeignKey(get_user_model(), related_name="following_set", on_delete=models.CASCADE)
    user_to = models.ForeignKey(get_user_model(), related_name="follower_set", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user_from", "user_to")
