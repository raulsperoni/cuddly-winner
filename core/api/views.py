from django.db.models import F
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    AuditEvent,
    Block,
    BlockVersion,
    Decision,
    Document,
    Snapshot,
    Suggestion,
)
from core.api.serializers import (
    AuditEventSerializer,
    BlockSerializer,
    BlockVersionSerializer,
    DocumentDetailSerializer,
    DocumentSerializer,
    PublicDocumentSerializer,
    SnapshotSerializer,
    SuggestionSerializer,
)
from services import llm


def _get_user_document(pk, user):
    return get_object_or_404(Document, pk=pk, created_by=user)


def _get_block(document, block_pk):
    return get_object_or_404(Block, pk=block_pk, document=document)


def _get_suggestion(block, suggestion_pk):
    return get_object_or_404(
        Suggestion, pk=suggestion_pk, block=block
    )


# --- Documents ---


class DocumentListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = Document.objects.filter(
            created_by=request.user
        ).order_by('-created_at')
        return Response(
            DocumentSerializer(docs, many=True).data
        )

    def post(self, request):
        ser = DocumentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        doc = Document.objects.create(
            title=ser.validated_data['title'],
            description=ser.validated_data.get('description', ''),
            status=ser.validated_data.get(
                'status', Document.STATUS_DRAFT
            ),
            created_by=request.user,
        )
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_DOCUMENT_CREATED,
            actor=request.user,
            data={'title': doc.title},
        )
        return Response(
            DocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = _get_user_document(pk, request.user)
        return Response(DocumentDetailSerializer(doc).data)

    def patch(self, request, pk):
        doc = _get_user_document(pk, request.user)
        allowed = {'title', 'description', 'status'}
        for field in allowed:
            if field in request.data:
                setattr(doc, field, request.data[field])
        doc.save()
        return Response(DocumentDetailSerializer(doc).data)


class DocumentHistoryView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = _get_user_document(pk, request.user)
        events = doc.audit_events.order_by('created_at')
        return Response(AuditEventSerializer(events, many=True).data)


# --- Blocks ---


class BlockListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = _get_user_document(pk, request.user)
        blocks = doc.blocks.order_by('position')
        return Response(BlockSerializer(blocks, many=True).data)

    def post(self, request, pk):
        doc = _get_user_document(pk, request.user)
        text = request.data.get('text', '')
        position = request.data.get(
            'position',
            doc.blocks.count(),
        )
        block = Block.objects.create(
            document=doc,
            position=position,
            created_by=request.user,
        )
        if text:
            BlockVersion.objects.create(
                block=block,
                text=text,
                author_type=BlockVersion.AUTHOR_HUMAN,
                author=request.user,
                is_current=True,
            )
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_BLOCK_CREATED,
            actor=request.user,
            block=block,
            data={'position': position},
        )
        return Response(
            BlockSerializer(block).data,
            status=status.HTTP_201_CREATED,
        )


class BlockReorderView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        doc = _get_user_document(pk, request.user)
        # expects: {"order": [block_id, block_id, ...]}
        order = request.data.get('order', [])
        if not isinstance(order, list):
            return Response(
                {'detail': 'order must be a list of block ids'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        block_ids = set(
            doc.blocks.values_list('id', flat=True)
        )
        if set(order) != block_ids:
            return Response(
                {'detail': 'order must include all block ids'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for i, block_id in enumerate(order):
            Block.objects.filter(
                pk=block_id, document=doc
            ).update(position=i)
        blocks = doc.blocks.order_by('position')
        return Response(BlockSerializer(blocks, many=True).data)


class BlockDetailView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        return Response(BlockSerializer(block).data)

    def patch(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        text = request.data.get('text')
        if text is None:
            return Response(
                {'detail': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current = block.current_version()
        if current and current.text == text:
            return Response(BlockSerializer(block).data)
        BlockVersion.objects.create(
            block=block,
            text=text,
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=request.user,
            based_on_version=current,
            is_current=True,
        )
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_BLOCK_EDITED,
            actor=request.user,
            block=block,
            data={},
        )
        block.refresh_from_db()
        return Response(BlockSerializer(block).data)

    def delete(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BlockSplitView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        first_text = request.data.get('first_text', '')
        second_text = request.data.get('second_text', '')
        if not first_text or not second_text:
            return Response(
                {'detail': 'first_text and second_text are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current = block.current_version()
        BlockVersion.objects.create(
            block=block,
            text=first_text,
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=request.user,
            based_on_version=current,
            is_current=True,
        )
        new_position = block.position + 1
        Block.objects.filter(
            document=doc,
            position__gte=new_position,
        ).exclude(pk=block.pk).update(position=F('position') + 1)
        new_block = Block.objects.create(
            document=doc,
            position=new_position,
            created_by=request.user,
        )
        BlockVersion.objects.create(
            block=new_block,
            text=second_text,
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=request.user,
            is_current=True,
        )
        return Response(
            {
                'first': BlockSerializer(block).data,
                'second': BlockSerializer(new_block).data,
            },
            status=status.HTTP_201_CREATED,
        )


# --- Block Versions ---


class BlockVersionListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        versions = block.versions.order_by('created_at')
        return Response(
            BlockVersionSerializer(versions, many=True).data
        )


# --- Suggestions ---


class SuggestionListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        suggestions = block.pending_suggestions()
        return Response(
            SuggestionSerializer(suggestions, many=True).data
        )

    def post(self, request, pk, block_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        suggestion_type = request.data.get('suggestion_type')
        valid_types = [
            Suggestion.TYPE_REWRITE,
            Suggestion.TYPE_IMPROVE,
            Suggestion.TYPE_SHORTEN,
            Suggestion.TYPE_EXPAND,
        ]
        if suggestion_type not in valid_types:
            return Response(
                {'detail': f'suggestion_type must be one of {valid_types}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            text = llm.get_suggestion(block, suggestion_type)
        except Exception:
            return Response(
                {'detail': 'LLM service unavailable'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        if not text:
            return Response(
                {'detail': 'LLM returned empty response'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        suggestion = Suggestion.objects.create(
            block=block,
            suggestion_type=suggestion_type,
            text=text,
            status=Suggestion.STATUS_PENDING,
        )
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SUGGESTION_CREATED,
            actor=request.user,
            block=block,
            data={'suggestion_type': suggestion_type},
        )
        return Response(
            SuggestionSerializer(suggestion).data,
            status=status.HTTP_201_CREATED,
        )


class SuggestionAcceptView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, block_pk, suggestion_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        suggestion = _get_suggestion(block, suggestion_pk)
        if suggestion.status != Suggestion.STATUS_PENDING:
            return Response(
                {'detail': 'Suggestion already resolved'},
                status=status.HTTP_409_CONFLICT,
            )
        current = block.current_version()
        new_version = BlockVersion.objects.create(
            block=block,
            text=suggestion.text,
            author_type=BlockVersion.AUTHOR_AI,
            based_on_version=current,
            is_current=True,
        )
        Decision.objects.create(
            suggestion=suggestion,
            block_version=new_version,
            decision_type=Decision.TYPE_ACCEPT,
            decided_by=request.user,
            notes=request.data.get('notes', ''),
        )
        suggestion.status = Suggestion.STATUS_ACCEPTED
        suggestion.save()
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SUGGESTION_ACCEPTED,
            actor=request.user,
            block=block,
            data={'decision_type': Decision.TYPE_ACCEPT},
        )
        block.refresh_from_db()
        return Response(BlockSerializer(block).data)


class SuggestionAcceptWithEditsView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, block_pk, suggestion_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        suggestion = _get_suggestion(block, suggestion_pk)
        if suggestion.status != Suggestion.STATUS_PENDING:
            return Response(
                {'detail': 'Suggestion already resolved'},
                status=status.HTTP_409_CONFLICT,
            )
        text = request.data.get('text', '')
        if not text:
            return Response(
                {'detail': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if text.strip().startswith('{'):
            return Response(
                {'detail': 'text must be plain Markdown, not JSON'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        current = block.current_version()
        new_version = BlockVersion.objects.create(
            block=block,
            text=text,
            author_type=BlockVersion.AUTHOR_HUMAN,
            author=request.user,
            based_on_version=current,
            is_current=True,
        )
        Decision.objects.create(
            suggestion=suggestion,
            block_version=new_version,
            decision_type=Decision.TYPE_ACCEPT_EDITS,
            decided_by=request.user,
            notes=request.data.get('notes', ''),
        )
        suggestion.status = Suggestion.STATUS_ACCEPTED
        suggestion.save()
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SUGGESTION_ACCEPTED,
            actor=request.user,
            block=block,
            data={'decision_type': Decision.TYPE_ACCEPT_EDITS},
        )
        block.refresh_from_db()
        return Response(BlockSerializer(block).data)


class SuggestionRejectView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, block_pk, suggestion_pk):
        doc = _get_user_document(pk, request.user)
        block = _get_block(doc, block_pk)
        suggestion = _get_suggestion(block, suggestion_pk)
        if suggestion.status != Suggestion.STATUS_PENDING:
            return Response(
                {'detail': 'Suggestion already resolved'},
                status=status.HTTP_409_CONFLICT,
            )
        current = block.current_version()
        Decision.objects.create(
            suggestion=suggestion,
            block_version=current,
            decision_type=Decision.TYPE_REJECT,
            decided_by=request.user,
            notes=request.data.get('notes', ''),
        )
        suggestion.status = Suggestion.STATUS_REJECTED
        suggestion.save()
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SUGGESTION_REJECTED,
            actor=request.user,
            block=block,
            data={},
        )
        block.refresh_from_db()
        return Response(BlockSerializer(block).data)


# --- Snapshots ---


class SnapshotListCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = _get_user_document(pk, request.user)
        snapshots = doc.snapshots.order_by('version_number')
        return Response(
            SnapshotSerializer(snapshots, many=True).data
        )

    def post(self, request, pk):
        doc = _get_user_document(pk, request.user)
        blocks = doc.blocks.order_by('position')
        lines = [f'# {doc.title}', '']
        if doc.description:
            lines += [doc.description, '']
        for block in blocks:
            cv = block.current_version()
            if cv:
                lines.append(cv.text)
                lines.append('')
        text = '\n'.join(lines).strip()
        snapshot = Snapshot.objects.create(
            document=doc,
            version_number=doc.next_snapshot_version,
            text=text,
            created_by=request.user,
        )
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SNAPSHOT_CREATED,
            actor=request.user,
            data={'version_number': snapshot.version_number},
        )
        return Response(
            SnapshotSerializer(snapshot).data,
            status=status.HTTP_201_CREATED,
        )


class SnapshotExportView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, snapshot_pk):
        doc = _get_user_document(pk, request.user)
        snapshot = get_object_or_404(
            Snapshot, pk=snapshot_pk, document=doc
        )
        github_repo = request.data.get('github_repo', '')
        github_token = request.data.get('github_token', '')
        if not github_repo:
            return Response(
                {'detail': 'github_repo is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from services import github_export
        import os
        token = github_token or os.environ.get('GITHUB_TOKEN', '')
        try:
            sha = github_export.export_snapshot(
                snapshot, github_repo, token
            )
        except Exception as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        snapshot.github_repo = github_repo
        snapshot.github_commit_sha = sha
        snapshot.save()
        AuditEvent.objects.create(
            document=doc,
            event_type=AuditEvent.EVT_SNAPSHOT_EXPORTED,
            actor=request.user,
            data={
                'github_repo': github_repo,
                'github_commit_sha': sha,
            },
        )
        return Response(SnapshotSerializer(snapshot).data)


# --- Public read-only ---


class PublicDocumentView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, token):
        doc = get_object_or_404(Document, public_token=token)
        return Response(PublicDocumentSerializer(doc).data)
