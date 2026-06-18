import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models


username_validator = RegexValidator(
    regex=r"^[a-z_]+$", message="Username must be lowercase or underscore only."
)

FORBIDDEN_USERNAMES = [
    "register",
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


class UserManager(BaseUserManager["User"]):
    def create_user(self, email, username, first_name, last_name, password=None):
        if not email:
            raise ValueError("Email is required.")
        if not username:
            raise ValueError("Username is required.")
        if not first_name:
            raise ValueError("First name is required.")
        if not last_name:
            raise ValueError("Last name is required.")
        user = self.model(
            email=self.normalize_email(email),
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, first_name, last_name, password=None):
        user = self.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(
        verbose_name="username",
        max_length=50,
        validators=[username_validator, validate_username_not_forbidden],
        unique=True,
        null=False,
        blank=False,
        db_index=True,
    )
    email = models.EmailField(
        verbose_name="email",
        validators=[deleted_email_validator],
        unique=True,
        null=False,
        blank=False,
        db_index=True,
    )
    first_name = models.CharField(
        verbose_name="first name",
        max_length=30,
        null=False,
        blank=False,
    )
    last_name = models.CharField(
        verbose_name="last name",
        max_length=30,
        null=False,
        blank=False,
    )
    date_joined = models.DateTimeField(
        verbose_name="date joined",
        auto_now_add=True,
    )
    is_admin = models.BooleanField(
        verbose_name="is admin",
        default=False,
    )
    is_active = models.BooleanField(
        verbose_name="is active",
        default=True,
    )
    is_staff = models.BooleanField(
        verbose_name="is staff",
        default=False,
    )
    is_superuser = models.BooleanField(
        verbose_name="is superuser",
        default=False,
    )
    is_verified = models.BooleanField(
        verbose_name="is verified",
        default=False,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.username} - {self.email}"

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return self.is_admin


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
