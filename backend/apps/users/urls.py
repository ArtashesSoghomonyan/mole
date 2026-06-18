from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("check-username/", views.CheckUsernameView.as_view(), name="check_username"),
    path("check-email/", views.CheckEmailView.as_view(), name="check_email"),
    path("login/", views.BrowserCompatibleTokenObtainPairView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("profile/", views.ProfileUpdateView.as_view(), name="profile"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("register/", views.RegisterView.as_view(), name="register"),
]
