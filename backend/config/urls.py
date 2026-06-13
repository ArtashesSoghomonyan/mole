from django.conf import settings
from django.contrib import admin
from django.urls import path
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView


class APIHealthView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({
            "message": "OK",
        }, status=status.HTTP_200_OK)


urlpatterns = [
    path("api/health/", APIHealthView.as_view(), name="api_health"),
]

if settings.DEBUG:
    urlpatterns.append(path("admin/", admin.site.urls))
else:
    urlpatterns.append(path(f"{settings.ADMIN_PATH}/", admin.site.urls))
