from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.response import Response
from rest_framework import status
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView

from apps.posts.views import PostViewSet


class APIHealthView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({
            "message": "OK",
        }, status=status.HTTP_200_OK)


router = DefaultRouter()

router.register("posts", PostViewSet, basename="posts")


urlpatterns = [
    path("api/health/", APIHealthView.as_view(), name="api_health"),
    path("api/posts", include(router.urls)),
    path("api/users/", include(("apps.users.urls", "users"))),
]

if settings.DEBUG:
    urlpatterns.append(path("admin/", admin.site.urls))
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns.append(path(f"{settings.ADMIN_PATH}/", admin.site.urls))
