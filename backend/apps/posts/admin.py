from django.contrib import admin

from apps.posts.models import ImagePost, Post, TextPost


admin.site.register(ImagePost)
admin.site.register(Post)
admin.site.register(TextPost)
