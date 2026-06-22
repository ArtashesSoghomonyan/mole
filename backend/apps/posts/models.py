import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone


class Post(models.Model):
    class PostType(models.TextChoices):
        TEXT = "text"
        IMAGE = "image"

    author = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    post_type = models.CharField(max_length=20, choices=PostType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"T<{self.post_type}>: @{self.author.username} - {self.created_at}"

    def save(self, *args, **kwargs):
        if self.pk is not None:
            self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-created_at"]


class TextPost(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="text_content")
    content = models.TextField()

    def __str__(self):
        return self.content


def image_upload_path(instance, filename):
    extension = filename.split(".")[-1]
    return f"posts/images/{uuid.uuid4()}.{extension}"


class ImagePost(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, related_name="image_content")
    image = models.ImageField(upload_to=image_upload_path)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Image: {self.description}"


class Comment(models.Model):
    author = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="comments",
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments",
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies"
    )

    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.text[:50]

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_reply(self):
        return self.parent is not None

    def save(self, *args, **kwargs):
        if self.parent and self.parent.parent:
            raise ValueError(
                "Replies to replies are not allowed"
            )
        super().save(*args, **kwargs)

    # top_comments = post.comments.filter(parent__isnull=True)
    # comment.replies.all()
