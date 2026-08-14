import argparse
import random

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management import BaseCommand, CommandError
from django.utils import timezone
from faker import Faker

from apps.posts.models import Comment, ImagePost, Post, PostLike, TextPost
from apps.users.models import Follow, Profile, User

fake = Faker()


def parse_range(value):
    """Parse ``MIN`` or ``MIN-MAX`` into an inclusive (min, max) tuple."""
    if isinstance(value, tuple):
        return value
    low, sep, high = value.partition("-")
    if sep:
        return int(low), int(high)
    number = int(value)
    return number, number


class Command(BaseCommand):
    help = "Seed the database with realistic dummy users, posts, and engagement."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Number of new users to create (default: 20).",
        )
        parser.add_argument(
            "--posts",
            type=parse_range,
            default=(5, 20),
            help="Posts per user, as MIN or MIN-MAX (default: 5-20).",
        )
        parser.add_argument(
            "--avatars",
            action=argparse.BooleanOptionalAction,
            default=True,
            help="Attach avatar images (default: on; use --no-avatars to disable).",
        )
        parser.add_argument(
            "--online-images",
            action=argparse.BooleanOptionalAction,
            default=True,
            help="Fetch images from picsum.photos (default: on; use --no-online-images for dog.jpg).",
        )
        parser.add_argument(
            "--image-count",
            type=int,
            default=10,
            help="Distinct online images to pre-fetch and reuse (default: 10).",
        )
        parser.add_argument(
            "--image-url",
            help="Use a single image URL for avatars and image posts.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=None,
            help="Seed for reproducible output.",
        )
        parser.add_argument(
            "--follows",
            type=parse_range,
            default=(1, 10),
            help="Followers per user, as MIN or MIN-MAX (default: 1-10).",
        )
        parser.add_argument(
            "--likes",
            type=parse_range,
            default=(0, 25),
            help="Likes per post, as MIN or MIN-MAX (default: 0-25).",
        )
        parser.add_argument(
            "--comments",
            type=parse_range,
            default=(0, 10),
            help="Comments per post, as MIN or MIN-MAX (default: 0-10).",
        )
        parser.add_argument(
            "--replies",
            type=parse_range,
            default=(0, 5),
            help="Replies per comment, as MIN or MIN-MAX (default: 0-5).",
        )

    def handle(self, *args, **options):
        seed = options["seed"]
        if seed is not None:
            Faker.seed(seed)
        self._rng = random.Random(seed)

        self._image_url = options["image_url"]
        self._online_images = options["online_images"]
        self._image_count = options["image_count"]
        # Cache of (filename, bytes) per size, so we download a handful of
        # images once and reuse them instead of hammering the network.
        self._image_cache = {}
        self._image_index = {}

        if self._image_url:
            self.stdout.write(f"  Using image URL: {self._image_url}")
        elif self._online_images:
            self.stdout.write(
                f"  Fetching {self._image_count} distinct images from picsum.photos"
            )

        posts_min, posts_max = options["posts"]
        follows_min, follows_max = options["follows"]
        likes_min, likes_max = options["likes"]
        comments_min, comments_max = options["comments"]
        replies_min, replies_max = options["replies"]

        users = []
        for _ in range(options["count"]):
            user = User.objects.create_user(
                email=fake.unique.email(),
                username=self._username(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password="testpass123",
            )
            user.is_verified = fake.boolean(chance_of_getting_true=80)
            user.save(update_fields=["is_verified"])
            profile = Profile.objects.create(
                user=user,
                bio=fake.text(max_nb_chars=200),
            )
            users.append((user, profile))
            self.stdout.write(f"  Created {user}")

        weights = self._popularity_weights(len(users))
        weights_by_user = {user.id: w for (user, _), w in zip(users, weights)}

        follows_created = 0
        if follows_max > 0:
            follows_created = self._add_follows(
                users, weights, follows_min, follows_max
            )

        if options["avatars"]:
            self._add_avatars(users)

        posts = self._add_posts(users, posts_min, posts_max)

        likes_created = 0
        if likes_max > 0:
            likes_created = self._add_likes(
                posts, weights_by_user, likes_min, likes_max
            )

        comments_created = 0
        if comments_max > 0:
            comments_created = self._add_comments(
                posts,
                weights_by_user,
                comments_min,
                comments_max,
                replies_min,
                replies_max,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {len(users)} users, {len(posts)} posts, "
                f"{follows_created} follows, {likes_created} likes, "
                f"{comments_created} comments created."
            )
        )

    def _username(self):
        # The model validator only allows lowercase letters and underscores.
        return fake.unique.bothify(
            text="user_????_????",
            letters="abcdefghijklmnopqrstuvwxyz",
        )

    def _dummy_image(self, width=800, height=600):
        filename, data = self._next_image(width, height)
        return ContentFile(data, name=filename)

    def _next_image(self, width, height):
        if self._image_url:
            return self._cached_single(self._image_url)

        if self._online_images:
            key = (width, height)
            if key not in self._image_cache:
                self._image_cache[key] = [
                    self._download(f"https://picsum.photos/seed/{i}/{width}/{height}")
                    for i in range(self._image_count)
                ]
                self._image_index[key] = 0

            pool = self._image_cache[key]
            index = self._image_index[key]
            self._image_index[key] = (index + 1) % len(pool)
            return pool[index]

        return "dog.jpg", self._local_image_bytes()

    def _cached_single(self, url):
        key = ("single", url)
        if key not in self._image_cache:
            self._image_cache[key] = self._download(url)
        return self._image_cache[key]

    def _download(self, url):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise CommandError(
                f"Could not download {url}: {exc}. "
                "Check your network connection, or use --no-online-images "
                "to fall back to the local dog.jpg."
            )

        if not response.headers.get("content-type", "").startswith("image/"):
            raise CommandError(
                f"URL did not return an image: {url} "
                f"(content-type: {response.headers.get('content-type')})."
            )

        filename = f"image.{self._extension_from(response)}"
        return filename, response.content

    def _extension_from(self, response):
        content_type = response.headers.get("content-type", "")
        for ext in ("png", "webp", "gif", "jpeg"):
            if ext in content_type:
                return "jpg" if ext == "jpeg" else ext
        return "jpg"

    def _local_image_bytes(self):
        if not hasattr(self, "_image_bytes"):
            image_path = settings.BASE_DIR / "test_data" / "dog.jpg"
            self._image_bytes = image_path.read_bytes()
        return self._image_bytes

    def _add_avatars(self, users):
        for _, profile in users:
            profile.avatar.save(
                "avatar.jpg", self._dummy_image(width=400, height=400), save=True
            )
        self.stdout.write("  Attached avatars.")

    def _add_posts(self, users, posts_min, posts_max):
        posts = []
        for user, _ in users:
            for _ in range(self._rng.randint(posts_min, posts_max)):
                post_type = Post.PostType.IMAGE if self._rng.random() < 0.5 else Post.PostType.TEXT
                post = Post.objects.create(author=user, post_type=post_type)

                if post.post_type == Post.PostType.TEXT:
                    TextPost.objects.create(
                        post=post,
                        content=fake.text(max_nb_chars=280),
                    )
                else:
                    ImagePost.objects.create(
                        post=post,
                        image=self._dummy_image(),
                        description=fake.sentence(),
                    )
                posts.append(post)
        return posts

    def _popularity_weights(self, count):
        # Heavy-tailed distribution: a few users become much more popular.
        raw = [self._rng.paretovariate(1.5) for _ in range(count)]
        total = sum(raw)
        return [w / total for w in raw]

    def _add_follows(self, users, weights, follows_min, follows_max):
        all_ids = [user.id for user, _ in users]
        n = len(all_ids)
        now = timezone.now()
        follows = []
        for (target_user, _), weight in zip(users, weights):
            base = self._rng.randint(follows_min, follows_max)
            count = min(int(round(base * weight * n)), n - 1)
            if count <= 0:
                continue
            follower_ids = self._rng.sample(
                [uid for uid in all_ids if uid != target_user.id], count
            )
            follows.extend(
                Follow(
                    user_from_id=uid,
                    user_to_id=target_user.id,
                    created_at=now,
                )
                for uid in follower_ids
            )
        Follow.objects.bulk_create(follows, ignore_conflicts=True)
        return len(follows)

    def _add_likes(self, posts, weights_by_user, likes_min, likes_max):
        all_ids = list(weights_by_user.keys())
        n = len(all_ids)
        now = timezone.now()
        likes = []
        for post in posts:
            weight = weights_by_user[post.author_id]
            base = self._rng.randint(likes_min, likes_max)
            count = min(int(round(base * weight * n)), n - 1)
            if count <= 0:
                continue
            liker_ids = self._rng.sample(
                [uid for uid in all_ids if uid != post.author_id], count
            )
            likes.extend(
                PostLike(user_id=uid, post_id=post.id, created_at=now)
                for uid in liker_ids
            )
        PostLike.objects.bulk_create(likes, ignore_conflicts=True)
        return len(likes)

    def _add_comments(
        self,
        posts,
        weights_by_user,
        comments_min,
        comments_max,
        replies_min,
        replies_max,
    ):
        all_ids = list(weights_by_user.keys())
        n = len(all_ids)
        now = timezone.now()

        top_comments = []
        for post in posts:
            weight = weights_by_user[post.author_id]
            base = self._rng.randint(comments_min, comments_max)
            count = min(int(round(base * weight * n)), n)
            if count <= 0:
                continue
            author_ids = self._rng.sample(all_ids, count)
            top_comments.extend(
                Comment(
                    author_id=uid,
                    post_id=post.id,
                    parent_id=None,
                    text=fake.sentence(),
                    created_at=now,
                )
                for uid in author_ids
            )

        # Plain bulk_create (no conflicts) so pks are populated for replies.
        Comment.objects.bulk_create(top_comments)

        replies = []
        for comment in top_comments:
            if replies_max <= 0:
                break
            # Only a subset of comments get replies.
            if self._rng.random() > 0.4:
                continue
            count = min(self._rng.randint(replies_min, replies_max), n)
            if count <= 0:
                continue
            author_ids = self._rng.sample(all_ids, count)
            replies.extend(
                Comment(
                    author_id=uid,
                    post_id=comment.post_id,
                    parent_id=comment.pk,
                    text=fake.sentence(),
                    created_at=now,
                )
                for uid in author_ids
            )

        Comment.objects.bulk_create(replies)
        return len(top_comments) + len(replies)
