import pytest
from django.contrib.auth.models import User
from core.models import (
    AuditEvent, Block, BlockVersion, Document, Suggestion,
)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser', password='pass', email='test@example.com'
    )


@pytest.fixture
def document(user):
    return Document.objects.create(
        title='Test Document',
        description='A test',
        created_by=user,
    )


@pytest.fixture
def block(document, user):
    return Block.objects.create(
        document=document,
        position=0,
        created_by=user,
    )


@pytest.mark.django_db
class TestDocument:
    def test_create(self, document):
        assert document.pk is not None
        assert document.title == 'Test Document'
        assert document.status == Document.STATUS_DRAFT
        assert document.public_token is not None

    def test_next_snapshot_version_no_snapshots(self, document):
        assert document.next_snapshot_version == 1

    def test_str(self, document):
        assert str(document) == 'Test Document'


@pytest.mark.django_db
class TestBlockAndVersion:
    def test_create_block(self, block):
        assert block.pk is not None
        assert block.position == 0

    def test_current_version_none_initially(self, block):
        assert block.current_version() is None

    def test_is_current_flag(self, block, user):
        v1 = BlockVersion.objects.create(
            block=block,
            text='First',
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=user,
            is_current=True,
        )
        v2 = BlockVersion.objects.create(
            block=block,
            text='Second',
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=user,
            is_current=True,
        )
        v1.refresh_from_db()
        assert not v1.is_current
        assert v2.is_current
        assert block.current_version().pk == v2.pk

    def test_pending_suggestions_empty(self, block):
        assert list(block.pending_suggestions()) == []


@pytest.mark.django_db
class TestSuggestion:
    def test_create_pending(self, block):
        s = Suggestion.objects.create(
            block=block,
            suggestion_type=Suggestion.TYPE_REWRITE,
            text='Rewritten text',
        )
        assert s.status == Suggestion.STATUS_PENDING
        assert list(block.pending_suggestions()) == [s]

    def test_accept(self, block):
        s = Suggestion.objects.create(
            block=block,
            suggestion_type=Suggestion.TYPE_IMPROVE,
            text='Improved text',
        )
        s.status = Suggestion.STATUS_ACCEPTED
        s.save()
        s.refresh_from_db()
        assert s.status == Suggestion.STATUS_ACCEPTED
        assert list(block.pending_suggestions()) == []

    def test_reject(self, block):
        s = Suggestion.objects.create(
            block=block,
            suggestion_type=Suggestion.TYPE_SHORTEN,
            text='Short text',
        )
        s.status = Suggestion.STATUS_REJECTED
        s.save()
        s.refresh_from_db()
        assert s.status == Suggestion.STATUS_REJECTED


@pytest.mark.django_db
class TestAuditEvent:
    def test_create(self, document, user):
        event = AuditEvent.objects.create(
            document=document,
            event_type=AuditEvent.EVT_DOCUMENT_CREATED,
            actor=user,
            data={'title': 'Test'},
        )
        assert event.pk is not None
        assert event.event_type == AuditEvent.EVT_DOCUMENT_CREATED
        assert event.data == {'title': 'Test'}

    def test_ordering(self, document, user):
        e1 = AuditEvent.objects.create(
            document=document,
            event_type=AuditEvent.EVT_DOCUMENT_CREATED,
            actor=user,
        )
        e2 = AuditEvent.objects.create(
            document=document,
            event_type=AuditEvent.EVT_BLOCK_CREATED,
            actor=user,
        )
        events = list(document.audit_events.all())
        assert events[0].pk == e2.pk
        assert events[1].pk == e1.pk
