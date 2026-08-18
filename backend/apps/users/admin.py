from django.contrib import admin

from apps.users.models import DeletedUserEmail, Profile, User

@admin.register(DeletedUserEmail)
class DeletedUserEmailAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "deleted_at")
    search_fields = ("email",)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "date_joined",
        "last_login",
        "is_active",
        "is_staff",
        "is_superuser",
        "is_verified",
        "followers_count",
        "following_count",
    )
    list_filter = ("date_joined", "last_login", "is_staff", "is_superuser", "is_verified")
    search_fields = ("username", "email", "first_name", "last_name")

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "avatar", "bio")
