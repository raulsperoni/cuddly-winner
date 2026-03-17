import uuid
from django.db import models
from django.contrib.auth.models import User


class Document(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='documents'
    )
    public_token = models.UUIDField(default=uuid.uuid4, unique=True)
    invite_token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def next_snapshot_version(self):
        last = self.snapshots.order_by('-version_number').first()
        return (last.version_number + 1) if last else 1


class Block(models.Model):
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='blocks'
    )
    position = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']

    def current_version(self):
        return self.versions.filter(is_current=True).first()

    def pending_suggestions(self):
        return self.suggestions.filter(status=Suggestion.STATUS_PENDING)


class DocumentMembership(models.Model):
    ROLE_COLLABORATOR = 'collaborator'
    ROLE_CHOICES = [
        (ROLE_COLLABORATOR, 'Collaborator'),
    ]

    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='memberships'
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='document_memberships'
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default=ROLE_COLLABORATOR
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['document', 'user']]

    def __str__(self):
        return f'{self.user.username} on {self.document_id} ({self.role})'


class BlockVersion(models.Model):
    AUTHOR_HUMAN = 'human'
    AUTHOR_AI = 'ai'
    AUTHOR_TYPE_CHOICES = [
        (AUTHOR_HUMAN, 'Human'),
        (AUTHOR_AI, 'AI'),
    ]
    block = models.ForeignKey(
        Block, on_delete=models.CASCADE, related_name='versions'
    )
    text = models.TextField()
    author_type = models.CharField(
        max_length=10, choices=AUTHOR_TYPE_CHOICES
    )
    author = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    based_on_version = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL
    )
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_current:
            BlockVersion.objects.filter(
                block=self.block, is_current=True
            ).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Suggestion(models.Model):
    TYPE_REWRITE = 'rewrite'
    TYPE_IMPROVE = 'improve'
    TYPE_SHORTEN = 'shorten'
    TYPE_EXPAND = 'expand'
    SUGGESTION_TYPE_CHOICES = [
        (TYPE_REWRITE, 'Rewrite'),
        (TYPE_IMPROVE, 'Improve clarity'),
        (TYPE_SHORTEN, 'Shorten'),
        (TYPE_EXPAND, 'Expand'),
    ]
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    block = models.ForeignKey(
        Block, on_delete=models.CASCADE, related_name='suggestions'
    )
    suggestion_type = models.CharField(
        max_length=20, choices=SUGGESTION_TYPE_CHOICES
    )
    text = models.TextField()
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)


class Decision(models.Model):
    TYPE_ACCEPT = 'accept'
    TYPE_REJECT = 'reject'
    TYPE_ACCEPT_EDITS = 'accept_with_edits'
    DECISION_TYPE_CHOICES = [
        (TYPE_ACCEPT, 'Accept'),
        (TYPE_REJECT, 'Reject'),
        (TYPE_ACCEPT_EDITS, 'Accept with edits'),
    ]
    suggestion = models.ForeignKey(
        Suggestion, null=True, blank=True, on_delete=models.CASCADE,
        related_name='decisions'
    )
    block_version = models.ForeignKey(
        BlockVersion, null=True, blank=True, on_delete=models.CASCADE,
        related_name='decisions'
    )
    decision_type = models.CharField(
        max_length=30, choices=DECISION_TYPE_CHOICES
    )
    decided_by = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Snapshot(models.Model):
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='snapshots'
    )
    version_number = models.PositiveIntegerField()
    text = models.TextField()
    metadata = models.JSONField(default=dict)
    github_commit_sha = models.CharField(max_length=40, blank=True)
    github_repo = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ['-version_number']
        unique_together = [['document', 'version_number']]


class AuditEvent(models.Model):
    EVT_DOCUMENT_CREATED = 'document_created'
    EVT_BLOCK_CREATED = 'block_created'
    EVT_BLOCK_EDITED = 'block_edited'
    EVT_SUGGESTION_CREATED = 'suggestion_created'
    EVT_SUGGESTION_ACCEPTED = 'suggestion_accepted'
    EVT_SUGGESTION_REJECTED = 'suggestion_rejected'
    EVT_SNAPSHOT_CREATED = 'snapshot_created'
    EVT_SNAPSHOT_EXPORTED = 'snapshot_exported'
    EVENT_TYPE_CHOICES = [
        (EVT_DOCUMENT_CREATED, 'Document Created'),
        (EVT_BLOCK_CREATED, 'Block Created'),
        (EVT_BLOCK_EDITED, 'Block Edited'),
        (EVT_SUGGESTION_CREATED, 'AI Suggestion Created'),
        (EVT_SUGGESTION_ACCEPTED, 'Suggestion Accepted'),
        (EVT_SUGGESTION_REJECTED, 'Suggestion Rejected'),
        (EVT_SNAPSHOT_CREATED, 'Snapshot Created'),
        (EVT_SNAPSHOT_EXPORTED, 'Snapshot Exported to GitHub'),
    ]
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='audit_events'
    )
    event_type = models.CharField(
        max_length=50, choices=EVENT_TYPE_CHOICES
    )
    actor = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    block = models.ForeignKey(
        Block, null=True, blank=True, on_delete=models.SET_NULL
    )
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
