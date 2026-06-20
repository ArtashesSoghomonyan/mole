from django.contrib import admin

from .models import ImagePost, Post, TextPost


admin.site.register(ImagePost)
admin.site.register(Post)
admin.site.register(TextPost)
