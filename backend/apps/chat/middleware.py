from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token):
    """Validate JWT token and return the user."""
    try:
        access_token = AccessToken(token)
        user = get_user_model().objects.get(id=access_token["user_id"])
        return user
    except (InvalidToken, TokenError, get_user_model().DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Middleware that authenticates WebSocket connections via JWT token in query params."""

    async def __call__(self, scope, receive, send):
        # Parse query string to get the token
        query_params = parse_qs(scope["query_string"].decode())
        token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
