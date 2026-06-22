from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class PostLikeTests(APITestCase):
    def setUp(self):
        self.client.post(reverse("users:register"), {
            "email": "johnsmith@example.com",
            "username": "johnsmith",
            "first_name": "John",
            "last_name": "Smith",
            "password": "password1234!",
        })
        self.client.post(reverse("users:register"), {
            "email": "alfred.lee@example.com",
            "username": "alfred",
            "first_name": "Alfred",
            "last_name": "Lee",
            "password": "VerySecurePassword3301#",
        })
        self.client.post(reverse("users:login"), {
            "email": "johnsmith@example.com",
            "password": "password1234!",
        })
        self.post = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Django or FastAPI for small calendar web app?",
        })

    def test_like_post_success(self):
        response = self.client.post(
            reverse("post-like", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_liked"])
        self.assertEqual(response.data["likes_count"], 1)

    def test_like_post_twice_returns_conflict(self):
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        response = self.client.post(
            reverse("post-like", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_like_post_updates_likes_count(self):
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        # Login as another user and like the same post
        self.client.post(reverse("users:login"), {
            "email": "alfred.lee@example.com",
            "password": "VerySecurePassword3301#",
        })
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        # Check likes count
        response = self.client.get(
            reverse("post-detail", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.data["likes_count"], 2)

    def test_unlike_post_success(self):
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        response = self.client.delete(
            reverse("post-unlike", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unlike_post_updates_likes_count(self):
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        self.client.delete(
            reverse("post-unlike", kwargs={"pk": self.post.data["id"]})
        )

        response = self.client.get(
            reverse("post-detail", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.data["likes_count"], 0)
        self.assertFalse(response.data["is_liked"])

    def test_unlike_post_not_liked_returns_not_found(self):
        response = self.client.delete(
            reverse("post-unlike", kwargs={"pk": self.post.data["id"]})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_like_nonexistent_post_returns_not_found(self):
        response = self.client.post(
            reverse("post-like", kwargs={"pk": 3301})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unlike_nonexistent_post_returns_not_found(self):
        response = self.client.delete(
            reverse("post-unlike", kwargs={"pk": 3301})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_is_liked_true_for_user_who_liked(self):
        self.client.post(reverse("post-like", kwargs={"pk": self.post.data["id"]}))

        response = self.client.get(
            reverse("post-detail", kwargs={"pk": self.post.data["id"]})
        )

        self.assertTrue(response.data["is_liked"])

    def test_is_liked_false_for_user_who_did_not_like(self):
        response = self.client.get(
            reverse("post-detail", kwargs={"pk": self.post.data["id"]})
        )

        self.assertFalse(response.data["is_liked"])
