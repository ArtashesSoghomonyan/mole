from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.posts.feed import get_scored_post_queryset
from apps.posts.models import Comment, Post, PostLike


class FeedScoringTests(APITestCase):
    """Unit tests for the feed scoring algorithm in feed.py"""

    def setUp(self):
        self.client.post(reverse("users:register"), {
            "email": "test@example.com",
            "username": "testuser",
            "first_name": "Test",
            "last_name": "Coleman",
            "password": "password1234!",
        })
        self.client.post(reverse("users:register"), {
            "email": "other@example.com",
            "username": "otheruser",
            "first_name": "Other",
            "last_name": "User",
            "password": "password1234!",
        })
        self.client.post(reverse("users:login"), {
            "email": "test@example.com",
            "password": "password1234!",
        })
        self.user = get_user_model().objects.get(email="test@example.com")
        self.other_user = get_user_model().objects.get(email="other@example.com")

    def _create_post(self):
        defaults = {
            "post_type": "text",
            "content": "Test post content",
        }
        return self.client.post(reverse("post-list"), defaults)

    def test_empty_feed_returns_empty_queryset(self):
        qs = get_scored_post_queryset()
        self.assertEqual(qs.count(), 0)

    def test_feed_score_includes_likes(self):
        post_resp = self._create_post()
        post = Post.objects.get(pk=post_resp.data["id"])

        # Like the post
        PostLike.objects.create(user=self.user, post=post)

        qs = get_scored_post_queryset()
        scored_post = qs.first()

        self.assertIsNotNone(scored_post)
        self.assertGreater(scored_post.feed_score, 0)
        self.assertEqual(scored_post.likes_count, 1)

    def test_feed_score_includes_comments(self):
        post_resp = self._create_post()
        post = Post.objects.get(pk=post_resp.data["id"])

        # Add a comment
        Comment.objects.create(
            author=self.user,
            post=post,
            text="Nice post!",
        )

        qs = get_scored_post_queryset()
        scored_post = qs.first()

        self.assertIsNotNone(scored_post)
        self.assertEqual(scored_post.comments_count, 1)

    def test_newer_post_outranks_older_post_with_same_engagement(self):
        # Create an older post
        old_post = Post.objects.create(
            author=self.user,
            post_type="text",
        )
        # Manually set created_at to 10 hours ago
        Post.objects.filter(pk=old_post.pk).update(
            created_at=timezone.now() - timedelta(hours=10)
        )

        # Create a newer post
        new_post = Post.objects.create(
            author=self.user,
            post_type="text",
        )
        # Manually set created_at to 1 hour ago
        Post.objects.filter(pk=new_post.pk).update(
            created_at=timezone.now() - timedelta(hours=1)
        )

        qs = get_scored_post_queryset()
        ordered = list(qs)

        # The newer post should come first
        self.assertEqual(ordered[0].id, new_post.pk)
        self.assertGreater(ordered[0].feed_score, ordered[1].feed_score)
