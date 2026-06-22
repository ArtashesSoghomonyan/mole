from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Profile


class ProfileTests(APITestCase):
    def test_update_profile(self):
        user = get_user_model().objects.create_user(
            email="john@example.com",
            username="john",
            first_name="John",
            last_name="Blacksmith",
            password="password123",
        )

        Profile.objects.create(user=user)

        self.client.force_authenticate(user=user)

        bio = "new bio test"

        with open("test_data/dog.jpg", "rb") as photo:
            response = self.client.patch(
                reverse("users:profile"),
                {"avatar": photo, "bio": bio},
                format="multipart",
            )

            self.assertEqual(response.status_code, status.HTTP_200_OK)
