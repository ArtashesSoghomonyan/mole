from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.chat import views

router = DefaultRouter()
router.register("conversations", views.ConversationViewSet, basename="conversations")

urlpatterns = [
    path("", include(router.urls))
]
