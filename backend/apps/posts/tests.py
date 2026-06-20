from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class PostTests(APITestCase):
    def setUp(self):
        self.client.post(reverse("users:register"), {
            "email": "test@example.com",
            "username": "testuser",
            "first_name": "Test",
            "last_name": "Coleman",
            "password": "password1234!",
        })
        self.client.post(reverse("users:login"), {
            "email": "test@example.com",
            "password": "password1234!",
        })

    def test_text_post_creation(self):
        response = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Hello, world!",
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_image_post_creation(self):
        with open("test_data/dog.jpg", "rb") as photo:
            response = self.client.post(
                reverse("post-list"),
                {
                    "post_type": "image",
                    "image": photo,
                    "description": "some description",
                },
                format="multipart",
            )

            self.assertEqual(response.status_code, 201)


    def test_current_users_posts_list(self):
        new_posts = [
            "This is my first post!",
            "Another post",
            "One more time."
        ]

        for post_text in new_posts:
            self.client.post(reverse("post-list"), {
                "post_type": "text",
                "content": post_text,
            })

        response = self.client.get(reverse("post-list"))

        self.assertEqual(
            [post.get("content").get("content") for post in response.data],
            list(reversed(new_posts))
        )

