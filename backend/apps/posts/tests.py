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
        self.client.post(reverse("users:register"), {
            "email": "anotheruser@example.com",
            "username": "anotheruser",
            "first_name": "another",
            "last_name": "user",
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

    def test_post_update_success(self):
        response_post_creation = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Hello, world!",
        })

        response_patch = self.client.patch(reverse("post-detail",
            kwargs={"pk": response_post_creation.data["id"]}), {
                "post_type": "text",
                "content": "UPDATED!!!",
            }
        )

        self.assertEqual(response_patch.data["content"]["content"], "UPDATED!!!")
        self.assertEqual(response_patch.status_code, status.HTTP_200_OK)

    def test_post_update_fail(self):
        response_post_creation = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Hello, world!",
        })

        new_post_id = response_post_creation.data["id"]

        self.client.post(reverse("users:login"), {
            "email": "anotheruser@example.com",
            "password": "password1234!",
        })

        response_patch = self.client.patch(reverse("post-detail",
            kwargs={"pk": new_post_id}), {
                "post_type": "text",
                "content": "UPDATED!!!",
            }
        )

        self.assertEqual(response_patch.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_delete_success(self):
        response_post_creation = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Hello, world!",
        })

        new_post_id = response_post_creation.data["id"]

        response_delete = self.client.delete(reverse("post-detail",
            kwargs={"pk": new_post_id}),
        )

        response_deleted = self.client.get(reverse("post-detail",
            kwargs={"pk": new_post_id}),
        )

        self.assertEqual(response_deleted.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)

    def test_post_delete_fail(self):
        response_post_creation = self.client.post(reverse("post-list"), {
            "post_type": "text",
            "content": "Hello, world!",
        })

        new_post_id = response_post_creation.data["id"]

        self.client.post(reverse("users:login"), {
            "email": "anotheruser@example.com",
            "password": "password1234!",
        })

        response_delete = self.client.delete(reverse("post-detail",
            kwargs={"pk": new_post_id}),
        )

        self.assertEqual(response_delete.status_code, status.HTTP_403_FORBIDDEN)
