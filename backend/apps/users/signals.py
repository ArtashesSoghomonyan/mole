from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver

from apps.users.models import DeletedUserEmail, Profile, User

@receiver(pre_delete, sender=User)
def create_deleted_email_instance(sender, instance, **kwargs):
    """
    Blacklist the email of a verified user when they are deleted.
    This is done for security purposes, so that the user can't create and delete infinite amount of accounts.
    """

    if instance.is_verified:
        DeletedUserEmail.objects.create(email=instance.email)


@receiver(post_save, sender=User)
def create_instances_after_user_registration(sender, instance, created, **kwargs):
    """
    Automatically creates a Profile instance whenever a new User is created.
    """
    if created:
        Profile.objects.create(user=instance)
