from django.db.models import Count, F, Value, FloatField, ExpressionWrapper
from django.db.models.functions import Now

from .models import Post


def get_scored_post_queryset():
    """
    Returns a QuerySet of Post objects annotated with a feed score.

    Score formula:
        score = likes * 1 + comments * 3 + shares * 5 - age_hours * 0.1

    Higher scores mean the post should appear higher in the feed.
    """
    queryset = (
        Post.objects.annotate(
            likes_count=Count("likes", distinct=True),
            comments_count=Count("comments", distinct=True),
            # Age in hours = (now - created_at) in seconds / 3600
            # Using Extract with 'epoch' on a datetime field directly
            # (not on a DurationField) for SQLite compatibility
            age_hours=ExpressionWrapper(
                (Now() - F("created_at")) / 3600.0,
                output_field=FloatField(),
            ),
            # score = likes * 1 + comments * 3 - age_hours * 0.1
            # (shares * 5 omitted until Share model is added)
            feed_score=ExpressionWrapper(
                F("likes_count") * Value(1.0)
                + F("comments_count") * Value(3.0)
                - F("age_hours") * Value(0.1),
                output_field=FloatField(),
            ),
        )
        .order_by("-feed_score")
    )

    return queryset
