from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Profile


class AuthTests(APITestCase):
    def setUp(self):
        self.email = "test@example.com"
        self.username = "testuser"
        self.password = "testpassword123"
        self.first_name = "John"
        self.last_name = "Smith"

        self.user = get_user_model().objects.create_user(
            email=self.email,
            username=self.username,
            password=self.password,
            first_name=self.first_name,
            last_name=self.last_name,
        )

    def test_login_endpoint(self):
        data = {
            "email": self.email,
            "password": self.password,
        }
        response = self.client.post(reverse("users:login"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_data(self):
        wrong_data = {
            "email": "wrongemail",
            "password": "password123",
        }
        response = self.client.post(reverse("users:login"), wrong_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_endpoint(self):
        data = {
            "email": self.email,
            "password": self.password,
        }
        self.client.post(reverse("users:login"), data)
        response_logout = self.client.post(reverse("users:logout"))
        self.assertEqual(response_logout.status_code, status.HTTP_200_OK)
        # Checking so that /me returns 401 status code
        response_me = self.client.get(reverse("users:me"))
        self.assertEqual(response_me.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_logout_unauthorized(self):
        response_logout = self.client.post(reverse("users:logout"))
        self.assertEqual(response_logout.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_success(self):
        data = {
            "email": self.email,
            "password": self.password,
        }
        self.client.post(reverse("users:login"), data)
        response_me = self.client.get(reverse("users:me"))
        self.assertEqual(response_me.status_code, status.HTTP_200_OK)

        self.assertEqual(response_me.data["email"], self.email)
        self.assertEqual(response_me.data["username"], self.username)
        self.assertEqual(response_me.data["first_name"], self.first_name)
        self.assertEqual(response_me.data["last_name"], self.last_name)

    def test_me_fail(self):
        response_me = self.client.get(reverse("users:me"))
        self.assertEqual(response_me.status_code, status.HTTP_401_UNAUTHORIZED)


class RegistrationTests(APITestCase):
    def setUp(self):
        self.email = "testuser@example.com"
        self.username = "testuser"
        self.first_name = "Test"
        self.last_name = "Smith"
        self.password = "testpassword123"

    def test_register_success(self):
        response = self.client.post(reverse("users:register"), {
            "email": self.email,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "password": self.password,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_fail(self):
        response = self.client.post(reverse("users:register"), {
            "email": self.email,
            "username": "Username", # testing the validation
            "first_name": self.first_name,
            "last_name": self.last_name,
            "password": self.password,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


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

            self.assertEqual(response.status_code, 200)
