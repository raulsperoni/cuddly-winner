import pytest
from django.contrib.auth.models import User
from django.urls import reverse

from core.models import (
    AuditEvent,
    Block,
    BlockVersion,
    Decision,
    Document,
    DocumentMembership,
    Snapshot,
    Suggestion,
)


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser', password='pass', email='test@example.com'
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username='other', password='pass', email='other@example.com'
    )


@pytest.fixture
def document(user):
    return Document.objects.create(
        title='Test Doc', description='Desc', created_by=user
    )


@pytest.fixture
def block(document, user):
    b = Block.objects.create(
        document=document, position=0, created_by=user
    )
    BlockVersion.objects.create(
        block=b,
        text='Initial text',
        author_type=BlockVersion.AUTHOR_HUMAN,
        author=user,
        is_current=True,
    )
    return b


@pytest.fixture
def pending_suggestion(block):
    return Suggestion.objects.create(
        block=block,
        suggestion_type=Suggestion.TYPE_IMPROVE,
        text='Better text',
        status=Suggestion.STATUS_PENDING,
    )


@pytest.fixture
def auth_client(client, user):
    client.login(username='testuser', password='pass')
    return client


@pytest.fixture
def collaborator_client(client, other_user):
    client.login(username='other', password='pass')
    return client


@pytest.fixture
def collaborator_membership(document, other_user):
    return DocumentMembership.objects.create(
        document=document,
        user=other_user,
        role=DocumentMembership.ROLE_COLLABORATOR,
    )


# --- Spec 011: list documents ---


@pytest.mark.django_db
class TestDocumentList:
    def test_list_own_documents(self, auth_client, document):
        resp = auth_client.get('/api/v1/documents/')
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]['title'] == 'Test Doc'
        assert 'block_count' in data[0]
        assert data[0]['access_role'] == 'owner'
        assert 'invite_token' in data[0]

    def test_excludes_other_users_documents(
        self, auth_client, other_user
    ):
        Document.objects.create(
            title='Other', created_by=other_user
        )
        resp = auth_client.get('/api/v1/documents/')
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_includes_collaborator_documents(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.get('/api/v1/documents/')
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]['id'] == document.pk
        assert data[0]['access_role'] == 'collaborator'
        assert data[0]['owner_username'] == document.created_by.username

    def test_unauthenticated_returns_403(self, client):
        resp = client.get('/api/v1/documents/')
        assert resp.status_code in (401, 403)

    def test_create_document(self, auth_client):
        resp = auth_client.post(
            '/api/v1/documents/',
            {'title': 'New Doc', 'description': 'Hello'},
            content_type='application/json',
        )
        assert resp.status_code == 201
        assert Document.objects.filter(title='New Doc').exists()
        assert AuditEvent.objects.filter(
            event_type=AuditEvent.EVT_DOCUMENT_CREATED
        ).exists()


# --- Spec 012: document detail with blocks ---


@pytest.mark.django_db
class TestDocumentDetail:
    def test_detail_includes_blocks(self, auth_client, document, block):
        resp = auth_client.get(f'/api/v1/documents/{document.pk}/')
        assert resp.status_code == 200
        data = resp.json()
        assert 'blocks' in data
        assert len(data['blocks']) == 1
        b = data['blocks'][0]
        assert b['current_version']['text'] == 'Initial text'
        assert 'pending_suggestions' in b
        assert data['invite_token'] == str(document.invite_token)
        assert data['access_role'] == 'owner'

    def test_collaborator_can_view_detail(
        self, collaborator_client, document, block, collaborator_membership
    ):
        resp = collaborator_client.get(f'/api/v1/documents/{document.pk}/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['access_role'] == 'collaborator'
        assert data['blocks'][0]['current_version']['text'] == 'Initial text'

    def test_foreign_document_returns_404(
        self, auth_client, other_user
    ):
        other_doc = Document.objects.create(
            title='Other', created_by=other_user
        )
        resp = auth_client.get(f'/api/v1/documents/{other_doc.pk}/')
        assert resp.status_code == 404

    def test_blocks_ordered_by_position(
        self, auth_client, document, user
    ):
        b1 = Block.objects.create(
            document=document, position=1, created_by=user
        )
        BlockVersion.objects.create(
            block=b1, text='B', author_type='human',
            author=user, is_current=True,
        )
        b0 = Block.objects.create(
            document=document, position=0, created_by=user
        )
        BlockVersion.objects.create(
            block=b0, text='A', author_type='human',
            author=user, is_current=True,
        )
        resp = auth_client.get(f'/api/v1/documents/{document.pk}/')
        texts = [
            b['current_version']['text']
            for b in resp.json()['blocks']
        ]
        assert texts[0] == 'A'
        assert texts[1] == 'B'

    def test_collaborator_cannot_patch_document(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.patch(
            f'/api/v1/documents/{document.pk}/',
            {'title': 'New title'},
            content_type='application/json',
        )
        assert resp.status_code == 403


# --- Spec 013: edit block text ---


@pytest.mark.django_db
class TestBlockEdit:
    def test_patch_creates_new_version(
        self, auth_client, document, block
    ):
        resp = auth_client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'Updated text'},
            content_type='application/json',
        )
        assert resp.status_code == 200
        assert block.versions.count() == 2
        current = block.current_version()
        assert current.text == 'Updated text'
        assert current.author_type == BlockVersion.AUTHOR_HUMAN
        assert AuditEvent.objects.filter(
            event_type=AuditEvent.EVT_BLOCK_EDITED
        ).exists()

    def test_unchanged_text_no_new_version(
        self, auth_client, document, block
    ):
        resp = auth_client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'Initial text'},
            content_type='application/json',
        )
        assert resp.status_code == 200
        assert block.versions.count() == 1

    def test_previous_version_not_current(
        self, auth_client, document, block
    ):
        old_version = block.current_version()
        auth_client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'New text'},
            content_type='application/json',
        )
        old_version.refresh_from_db()
        assert not old_version.is_current

    def test_unauthenticated_returns_403(self, client, document, block):
        resp = client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'x'},
            content_type='application/json',
        )
        assert resp.status_code in (401, 403)

    def test_collaborator_can_edit_block(
        self, collaborator_client, document, block, collaborator_membership
    ):
        resp = collaborator_client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'Collaborator edit'},
            content_type='application/json',
        )
        assert resp.status_code == 200
        block.refresh_from_db()
        assert block.current_version().text == 'Collaborator edit'


# --- Spec 015: accept suggestion ---


@pytest.mark.django_db
class TestAcceptSuggestion:
    def test_accept_creates_ai_block_version(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        resp = auth_client.post(
            url, {}, content_type='application/json'
        )
        assert resp.status_code == 200
        block.refresh_from_db()
        current = block.current_version()
        assert current.author_type == BlockVersion.AUTHOR_AI
        assert current.text == 'Better text'
        assert current.is_current

    def test_accept_creates_decision(
        self, auth_client, user, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        auth_client.post(url, {}, content_type='application/json')
        decision = Decision.objects.get(suggestion=pending_suggestion)
        assert decision.decision_type == Decision.TYPE_ACCEPT
        assert decision.decided_by == user

    def test_accept_sets_suggestion_status(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        auth_client.post(url, {}, content_type='application/json')
        pending_suggestion.refresh_from_db()
        assert pending_suggestion.status == Suggestion.STATUS_ACCEPTED

    def test_accept_writes_audit_event(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        auth_client.post(url, {}, content_type='application/json')
        assert AuditEvent.objects.filter(
            event_type=AuditEvent.EVT_SUGGESTION_ACCEPTED
        ).exists()

    def test_accept_already_resolved_returns_409(
        self, auth_client, document, block, pending_suggestion
    ):
        pending_suggestion.status = Suggestion.STATUS_ACCEPTED
        pending_suggestion.save()
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        resp = auth_client.post(
            url, {}, content_type='application/json'
        )
        assert resp.status_code == 409

    def test_unauthenticated_returns_403(
        self, client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        resp = client.post(url, {}, content_type='application/json')
        assert resp.status_code in (401, 403)

    def test_collaborator_can_accept(
        self, collaborator_client, document, block,
        pending_suggestion, collaborator_membership
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        resp = collaborator_client.post(
            url, {}, content_type='application/json'
        )
        assert resp.status_code == 200


# --- Spec 016: accept with edits ---


@pytest.mark.django_db
class TestAcceptWithEdits:
    def test_accept_with_edits_creates_human_version(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept-with-edits/'
        )
        resp = auth_client.post(
            url,
            {'text': 'My edited version'},
            content_type='application/json',
        )
        assert resp.status_code == 200
        current = block.current_version()
        assert current.author_type == BlockVersion.AUTHOR_HUMAN
        assert current.text == 'My edited version'

    def test_decision_type_is_accept_with_edits(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept-with-edits/'
        )
        auth_client.post(
            url,
            {'text': 'My edited version'},
            content_type='application/json',
        )
        d = Decision.objects.get(suggestion=pending_suggestion)
        assert d.decision_type == Decision.TYPE_ACCEPT_EDITS

    def test_json_text_returns_400(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept-with-edits/'
        )
        resp = auth_client.post(
            url,
            {'text': '{"type": "doc"}'},
            content_type='application/json',
        )
        assert resp.status_code == 400

    def test_empty_text_returns_400(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept-with-edits/'
        )
        resp = auth_client.post(
            url, {'text': ''}, content_type='application/json'
        )
        assert resp.status_code == 400

    def test_suggestion_status_set_accepted(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept-with-edits/'
        )
        auth_client.post(
            url,
            {'text': 'Edited'},
            content_type='application/json',
        )
        pending_suggestion.refresh_from_db()
        assert pending_suggestion.status == Suggestion.STATUS_ACCEPTED


# --- Spec 017: reject suggestion ---


@pytest.mark.django_db
class TestRejectSuggestion:
    def test_reject_no_new_block_version(
        self, auth_client, document, block, pending_suggestion
    ):
        count_before = block.versions.count()
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/reject/'
        )
        auth_client.post(url, {}, content_type='application/json')
        assert block.versions.count() == count_before

    def test_reject_creates_decision(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/reject/'
        )
        auth_client.post(url, {}, content_type='application/json')
        d = Decision.objects.get(suggestion=pending_suggestion)
        assert d.decision_type == Decision.TYPE_REJECT

    def test_reject_sets_suggestion_status(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/reject/'
        )
        auth_client.post(url, {}, content_type='application/json')
        pending_suggestion.refresh_from_db()
        assert pending_suggestion.status == Suggestion.STATUS_REJECTED

    def test_current_text_unchanged(
        self, auth_client, document, block, pending_suggestion
    ):
        original_text = block.current_version().text
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/reject/'
        )
        auth_client.post(url, {}, content_type='application/json')
        assert block.current_version().text == original_text

    def test_reject_writes_audit_event(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/reject/'
        )
        auth_client.post(url, {}, content_type='application/json')
        assert AuditEvent.objects.filter(
            event_type=AuditEvent.EVT_SUGGESTION_REJECTED
        ).exists()


# --- Spec 009: custom AI suggestion ---


@pytest.mark.django_db
class TestCustomSuggestion:
    def test_custom_suggestion_requires_instruction(
        self, auth_client, document, block
    ):
        url = (
            f'/api/v1/documents/{document.pk}'
            f'/blocks/{block.pk}/suggestions/'
        )
        resp = auth_client.post(
            url,
            {'suggestion_type': 'custom'},
            content_type='application/json',
        )
        assert resp.status_code == 400
        assert 'instruction' in resp.json()['detail']

    def test_custom_suggestion_stores_instruction(
        self, auth_client, document, block, monkeypatch
    ):
        monkeypatch.setattr(
            'services.llm.get_suggestion',
            lambda block, stype, instruction='': 'AI response',
        )
        url = (
            f'/api/v1/documents/{document.pk}'
            f'/blocks/{block.pk}/suggestions/'
        )
        resp = auth_client.post(
            url,
            {
                'suggestion_type': 'custom',
                'instruction': 'this is too broad',
            },
            content_type='application/json',
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data['suggestion_type'] == 'custom'
        assert data['instruction'] == 'this is too broad'
        s = Suggestion.objects.get(pk=data['id'])
        assert s.instruction == 'this is too broad'

    def test_custom_suggestion_audit_records_instruction(
        self, auth_client, document, block, monkeypatch
    ):
        monkeypatch.setattr(
            'services.llm.get_suggestion',
            lambda block, stype, instruction='': 'AI response',
        )
        url = (
            f'/api/v1/documents/{document.pk}'
            f'/blocks/{block.pk}/suggestions/'
        )
        auth_client.post(
            url,
            {
                'suggestion_type': 'custom',
                'instruction': 'make it shorter',
            },
            content_type='application/json',
        )
        event = AuditEvent.objects.filter(
            event_type=AuditEvent.EVT_SUGGESTION_CREATED
        ).first()
        assert event.data['instruction'] == 'make it shorter'


# --- Spec 018: block version history ---


@pytest.mark.django_db
class TestBlockVersionHistory:
    def test_returns_versions_chronological(
        self, auth_client, document, block, user
    ):
        BlockVersion.objects.create(
            block=block, text='v2', author_type='human',
            author=user, is_current=True,
        )
        url = (
            f'/api/v1/documents/{document.pk}'
            f'/blocks/{block.pk}/versions/'
        )
        resp = auth_client.get(url)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]['text'] == 'Initial text'
        assert data[1]['text'] == 'v2'

    def test_unauthenticated_returns_403(
        self, client, document, block
    ):
        url = (
            f'/api/v1/documents/{document.pk}'
            f'/blocks/{block.pk}/versions/'
        )
        resp = client.get(url)
        assert resp.status_code in (401, 403)


# --- Spec 019: document audit timeline ---


@pytest.mark.django_db
class TestDocumentHistory:
    def test_returns_events_chronological(
        self, auth_client, document, user
    ):
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
        resp = auth_client.get(
            f'/api/v1/documents/{document.pk}/history/'
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data[0]['id'] == e1.pk
        assert data[1]['id'] == e2.pk

    def test_unauthenticated_returns_403(self, client, document):
        resp = client.get(f'/api/v1/documents/{document.pk}/history/')
        assert resp.status_code in (401, 403)

    def test_collaborator_can_view_history(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.get(
            f'/api/v1/documents/{document.pk}/history/'
        )
        assert resp.status_code == 200


# --- Spec 020: no bulk accept ---


@pytest.mark.django_db
class TestNoBulkAccept:
    def test_bulk_accept_url_does_not_exist(self, auth_client, document):
        resp = auth_client.post(
            f'/api/v1/documents/{document.pk}/suggestions/bulk-accept/',
            {},
            content_type='application/json',
        )
        assert resp.status_code == 404

    def test_accept_all_url_does_not_exist(self, auth_client, document):
        resp = auth_client.post(
            f'/api/v1/documents/{document.pk}/suggestions/accept-all/',
            {},
            content_type='application/json',
        )
        assert resp.status_code == 404


# --- Spec 024: public read-only ---


@pytest.mark.django_db
class TestPublicDocument:
    def test_public_view_unauthenticated(self, client, document, block):
        resp = client.get(
            f'/api/v1/public/{document.public_token}/'
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data['title'] == 'Test Doc'
        assert len(data['blocks']) == 1
        b = data['blocks'][0]
        assert b['current_version']['text'] == 'Initial text'
        assert b['current_version']['author_type'] == 'human'

    def test_public_view_no_audit_events(
        self, client, document, block
    ):
        AuditEvent.objects.create(
            document=document,
            event_type=AuditEvent.EVT_DOCUMENT_CREATED,
        )
        resp = client.get(
            f'/api/v1/public/{document.public_token}/'
        )
        data = resp.json()
        assert 'audit_events' not in data
        assert 'history' not in data

    def test_public_view_invalid_token_returns_404(self, client):
        resp = client.get(
            '/api/v1/public/00000000-0000-0000-0000-000000000000/'
        )
        assert resp.status_code == 404

    def test_public_view_no_pending_suggestions(
        self, client, document, block, pending_suggestion
    ):
        resp = client.get(
            f'/api/v1/public/{document.public_token}/'
        )
        data = resp.json()
        b = data['blocks'][0]
        assert 'pending_suggestions' not in b


# --- Spec 025: no Decision-less AI BlockVersions ---


@pytest.mark.django_db
class TestNoDecisionlessAIVersions:
    def test_accept_always_creates_decision(
        self, auth_client, document, block, pending_suggestion
    ):
        url = (
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}'
            f'/suggestions/{pending_suggestion.pk}/accept/'
        )
        auth_client.post(url, {}, content_type='application/json')
        ai_versions = BlockVersion.objects.filter(
            block=block, author_type=BlockVersion.AUTHOR_AI
        )
        for v in ai_versions:
            assert v.decisions.exists(), (
                f'BlockVersion {v.pk} (AI) has no Decision'
            )

    def test_direct_block_version_creation_human_only(
        self, auth_client, document, block
    ):
        auth_client.patch(
            f'/api/v1/documents/{document.pk}/blocks/{block.pk}/',
            {'text': 'Human edit'},
            content_type='application/json',
        )
        for v in block.versions.all():
            assert v.author_type == BlockVersion.AUTHOR_HUMAN


# --- Document create with initial_content ---


@pytest.mark.django_db
class TestDocumentCreateWithContent:
    def test_initial_content_creates_blocks(self, auth_client):
        resp = auth_client.post(
            '/api/v1/documents/',
            {
                'title': 'Policy Doc',
                'initial_content': 'First paragraph.\n\nSecond paragraph.',
            },
            content_type='application/json',
        )
        assert resp.status_code == 201
        doc_id = resp.json()['id']
        doc = Document.objects.get(pk=doc_id)
        assert doc.blocks.count() == 2
        texts = list(
            doc.blocks.order_by('position').values_list(
                'versions__text', flat=True
            )
        )
        assert 'First paragraph.' in texts
        assert 'Second paragraph.' in texts

    def test_no_initial_content_creates_no_blocks(self, auth_client):
        resp = auth_client.post(
            '/api/v1/documents/',
            {'title': 'Empty Doc'},
            content_type='application/json',
        )
        assert resp.status_code == 201
        doc_id = resp.json()['id']
        assert Document.objects.get(pk=doc_id).blocks.count() == 0

    def test_block_versions_are_human_authored(self, auth_client):
        auth_client.post(
            '/api/v1/documents/',
            {
                'title': 'Doc',
                'initial_content': 'Some text.',
            },
            content_type='application/json',
        )
        doc = Document.objects.get(title='Doc')
        for block in doc.blocks.all():
            assert block.current_version().author_type == 'human'


@pytest.mark.django_db
class TestCollaboratorMembershipApi:
    def test_owner_lists_members(
        self, auth_client, document, collaborator_membership
    ):
        resp = auth_client.get(f'/api/v1/documents/{document.pk}/members/')
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]['username'] == collaborator_membership.user.username

    def test_collaborator_cannot_list_members(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.get(
            f'/api/v1/documents/{document.pk}/members/'
        )
        assert resp.status_code == 403

    def test_owner_can_remove_member(
        self, auth_client, document, collaborator_membership
    ):
        resp = auth_client.delete(
            f'/api/v1/documents/{document.pk}/members/{collaborator_membership.user_id}/'
        )
        assert resp.status_code == 204
        assert not DocumentMembership.objects.filter(
            document=document,
            user=collaborator_membership.user,
        ).exists()


@pytest.mark.django_db
class TestOwnerOnlySnapshotApi:
    def test_collaborator_cannot_list_snapshots(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.get(
            f'/api/v1/documents/{document.pk}/snapshots/'
        )
        assert resp.status_code == 403

    def test_collaborator_cannot_create_snapshot(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.post(
            f'/api/v1/documents/{document.pk}/snapshots/',
            {},
            content_type='application/json',
        )
        assert resp.status_code == 403


@pytest.mark.django_db
class TestJoinDocumentFlow:
    def test_authenticated_join_creates_membership(
        self, collaborator_client, document
    ):
        resp = collaborator_client.get(f'/join/{document.invite_token}/')
        assert resp.status_code == 302
        assert resp.url == f'/documents/{document.pk}/edit/?join_status=joined'
        assert DocumentMembership.objects.filter(
            document=document,
            user__username='other',
        ).exists()

    def test_unauthenticated_join_redirects_to_signup(
        self, client, document
    ):
        resp = client.get(f'/join/{document.invite_token}/')
        assert resp.status_code == 302
        assert resp.url == f'/accounts/signup/?next=/join/{document.invite_token}/'

    def test_existing_access_redirects_without_duplicate_membership(
        self, collaborator_client, document, collaborator_membership
    ):
        resp = collaborator_client.get(f'/join/{document.invite_token}/')
        assert resp.status_code == 302
        assert (
            resp.url
            == f'/documents/{document.pk}/edit/?join_status=already-has-access'
        )
        assert DocumentMembership.objects.filter(document=document).count() == 1


# --- Auth me ---


@pytest.mark.django_db
class TestAuthMe:
    def test_returns_current_user(self, auth_client, user):
        resp = auth_client.get('/api/v1/auth/me/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['username'] == 'testuser'
        assert data['id'] == user.pk

    def test_unauthenticated_returns_403(self, client):
        resp = client.get('/api/v1/auth/me/')
        assert resp.status_code in (401, 403)


# --- SPA shell routes ---


@pytest.mark.django_db
class TestSpaShellRoutes:
    def test_home_serves_shell(self, auth_client):
        resp = auth_client.get('/')
        assert resp.status_code == 200
        assert b'id="root"' in resp.content

    def test_document_detail_serves_shell(self, auth_client, document):
        resp = auth_client.get(f'/documents/{document.pk}/')
        assert resp.status_code == 200
        assert b'id="root"' in resp.content

    def test_unauthenticated_home_redirects(self, client):
        resp = client.get('/')
        assert resp.status_code == 302
