from django.db.models import Count, F, Value, FloatField, ExpressionWrapper, Func
from django.db.models.functions import Now

from .models import Post


class EpochSeconds(Func):
    """
    Returns the number of seconds since the Unix epoch for a datetime expression.
    Uses EXTRACT(EPOCH FROM ...) on PostgreSQL and unixepoch(...) on SQLite 3.50+.
    """
    output_field = FloatField()

    def as_sqlite(self, compiler, connection):
        sql, params = compiler.compile(self.source_expressions[0])
        return f"unixepoch({sql})", params

    def as_postgresql(self, compiler, connection):
        sql, params = compiler.compile(self.source_expressions[0])
        return f"EXTRACT(EPOCH FROM {sql})", params


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
            # Uses unixepoch() on SQLite and EXTRACT(EPOCH FROM ...) on PostgreSQL
            age_hours=ExpressionWrapper(
                (EpochSeconds(Now()) - EpochSeconds(F("created_at"))) / 3600.0,
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
