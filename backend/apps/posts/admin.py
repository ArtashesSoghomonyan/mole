from django.contrib import admin

from apps.posts.models import Comment, ImagePost, Post, PostLike, TextPost


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_filter = ("author", "post_type", "created_at")
    list_display = ("id", "author", "post_type", "created_at", "updated_at")
    search_fields = ("author",)

@admin.register(TextPost)
class TextPostAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "content")
    search_fields = ("post", "content")

@admin.register(ImagePost)
class ImagePostAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "image", "description")
    search_fields = ("post", "description")

@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "created_at")
    list_filter = ("user", "post")

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_filter = ("author", "post", "parent", "is_reply")
    list_display = ("id", "author", "post", "parent", "text", "created_at", "updated_at", "is_reply")
