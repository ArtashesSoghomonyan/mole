from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views import (
    BrowserCompatibleTokenObtainPairView,
    CheckEmailView,
    CheckUsernameView,
    FollowView,
    LogoutView,
    MeView,
    ProfileUpdateView,
    RegisterView,
    UserSearchView,
    UserView,
    ValidatePasswordView,
)

urlpatterns = [
    path("check-username/", CheckUsernameView.as_view(), name="check_username"),
    path("check-email/", CheckEmailView.as_view(), name="check_email"),
    path("follow/<slug:username>/", FollowView.as_view(), name="follow"),
    path("login/", BrowserCompatibleTokenObtainPairView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileUpdateView.as_view(), name="profile"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("search/", UserSearchView.as_view(), name="search_user"),
    path("validate-password/", ValidatePasswordView.as_view(), name="validate_password"),
    path("<slug:username>/", UserView.as_view(), name="user"),
]
