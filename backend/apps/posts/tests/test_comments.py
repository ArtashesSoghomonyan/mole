from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CommentTests(APITestCase):
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
        self.client.post(reverse("users:register"), {
            "email": "JayneMHall@example.com",
            "username": "jayne",
            "first_name": "Jayne",
            "last_name": "Hall",
            "password": "DontHackMyAccount5577,)",
        })
        self.client.post(reverse("users:login"), {
            "email": "johnsmith@example.com",
            "password": "password1234!",
        })
        self.post = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Django or FastAPI for small calendar web app?",
        })

    def test_comment_creation(self):
        response = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "Django for sure!",
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_comment_without_post_id(self):
        response = self.client.post(reverse("comment-list"), {
            "text": "This should fail",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_comment_nonexistent_post(self):
        response = self.client.post(reverse("comment-list"), {
            "post": 3301,
            "text": "This should fail",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_comment_blank_text(self):
        response = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reply(self):
        comment = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "Django for sure!",
        })

        self.client.post(reverse("users:login"), {
            "email": "alfred@example.com",
            "password": "VerySecurePassword3301#",
        })

        response = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "parent": comment.data["id"],
            "text": "I agree!",
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_reply_nonexistent_parent(self):
        response = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "parent": 3301,
            "text": "This should fail",
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_comments(self):
        self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "First comment!",
        })
        self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "Second comment!",
        })

        response = self.client.get(reverse("comment-list"), {
            "post": self.post.data["id"],
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_comments_without_post_param(self):
        response = self.client.get(reverse("comment-list"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_comment(self):
        comment = self.client.post(reverse("comment-list"), {
            "post": self.post.data["id"],
            "text": "Retrieve me!",
        })

        response = self.client.get(reverse("comment-detail", kwargs={"pk": comment.data["id"]}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["text"], "Retrieve me!")
