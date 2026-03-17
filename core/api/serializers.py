from rest_framework import serializers

from core.models import (
    AuditEvent,
    Block,
    BlockVersion,
    Decision,
    Document,
    Snapshot,
    Suggestion,
)


class BlockVersionSerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = BlockVersion
        fields = [
            'id', 'text', 'author_type', 'author_username',
            'based_on_version_id', 'is_current', 'created_at',
        ]

    def get_author_username(self, obj):
        return obj.author.username if obj.author else None


class DecisionSerializer(serializers.ModelSerializer):
    decided_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Decision
        fields = [
            'id', 'decision_type', 'decided_by_username',
            'notes', 'created_at',
        ]
        read_only_fields = fields

    def get_decided_by_username(self, obj):
        return obj.decided_by.username


class SuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suggestion
        fields = [
            'id', 'suggestion_type', 'text', 'status', 'created_at',
        ]


class BlockSerializer(serializers.ModelSerializer):
    current_version = serializers.SerializerMethodField()
    pending_suggestions = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = [
            'id', 'position', 'current_version',
            'pending_suggestions', 'created_at',
        ]

    def get_current_version(self, obj):
        v = obj.current_version()
        if v:
            return BlockVersionSerializer(v).data
        return None

    def get_pending_suggestions(self, obj):
        return SuggestionSerializer(
            obj.pending_suggestions(), many=True
        ).data


class DocumentSerializer(serializers.ModelSerializer):
    block_count = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'status',
            'created_at', 'updated_at', 'public_token', 'block_count',
        ]

    def get_block_count(self, obj):
        return obj.blocks.count()


class DocumentDetailSerializer(DocumentSerializer):
    blocks = BlockSerializer(many=True, read_only=True)

    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ['blocks']


class AuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = [
            'id', 'event_type', 'actor_username',
            'block_id', 'data', 'created_at',
        ]

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None


class SnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snapshot
        fields = [
            'id', 'version_number', 'text', 'metadata',
            'github_commit_sha', 'github_repo', 'created_at',
        ]


class PublicBlockSerializer(serializers.ModelSerializer):
    current_version = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ['id', 'position', 'current_version']

    def get_current_version(self, obj):
        v = obj.current_version()
        if v:
            return {'text': v.text, 'author_type': v.author_type}
        return None


class PublicDocumentSerializer(serializers.ModelSerializer):
    blocks = PublicBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'description', 'blocks']
