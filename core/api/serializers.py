from rest_framework import serializers

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


class BlockVersionSerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()
    decision = serializers.SerializerMethodField()

    class Meta:
        model = BlockVersion
        fields = [
            'id', 'text', 'author_type', 'author_username',
            'based_on_version_id', 'is_current', 'created_at', 'decision',
        ]

    def get_author_username(self, obj):
        return obj.author.username if obj.author else None

    def get_decision(self, obj):
        decision = obj.decisions.select_related('decided_by').order_by(
            '-created_at'
        ).first()
        if decision:
            return DecisionSerializer(decision).data
        return None


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
            'id', 'suggestion_type', 'instruction', 'text', 'status', 'origin',
            'created_at',
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
        if not self.context.get('include_pending_suggestions', True):
            return []
        return SuggestionSerializer(
            obj.pending_suggestions(), many=True, context=self.context
        ).data


class DocumentSerializer(serializers.ModelSerializer):
    block_count = serializers.SerializerMethodField()
    access_role = serializers.SerializerMethodField()
    owner_username = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_decide = serializers.SerializerMethodField()
    can_request_suggestions = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'status',
            'created_at', 'updated_at', 'public_token', 'invite_token',
            'is_onboarding', 'block_count', 'access_role', 'owner_username',
            'can_edit', 'can_decide', 'can_request_suggestions',
        ]

    def get_block_count(self, obj):
        return obj.blocks.count()

    def get_access_role(self, obj):
        return getattr(obj, 'access_role', 'owner')

    def get_owner_username(self, obj):
        return obj.created_by.username

    def get_can_edit(self, obj):
        return getattr(obj, 'access_role', 'owner') in {'owner', 'collaborator'}

    def get_can_decide(self, obj):
        return getattr(obj, 'access_role', 'owner') in {'owner', 'collaborator'}

    def get_can_request_suggestions(self, obj):
        return getattr(obj, 'access_role', 'owner') in {
            'owner', 'collaborator', 'onboarding_guest'
        }


class DocumentDetailSerializer(DocumentSerializer):
    blocks = serializers.SerializerMethodField()

    class Meta(DocumentSerializer.Meta):
        fields = DocumentSerializer.Meta.fields + ['blocks']

    def get_blocks(self, obj):
        return BlockSerializer(
            obj.blocks.order_by('position'),
            many=True,
            context=self.context,
        ).data


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


class PublicAuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    class Meta:
        model = AuditEvent
        fields = [
            'id', 'event_type', 'actor_username',
            'block_id', 'data', 'created_at',
        ]

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None

    def get_data(self, obj):
        allowed = {}
        if 'suggestion_type' in obj.data:
            allowed['suggestion_type'] = obj.data['suggestion_type']
        if 'decision_type' in obj.data:
            allowed['decision_type'] = obj.data['decision_type']
        if 'origin' in obj.data:
            allowed['origin'] = obj.data['origin']
        return allowed


class SnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Snapshot
        fields = [
            'id', 'version_number', 'text', 'metadata',
            'github_commit_sha', 'github_repo', 'created_at',
        ]


class MembershipSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = DocumentMembership
        fields = ['user_id', 'username', 'role', 'joined_at']

    def get_username(self, obj):
        return obj.user.username


class PublicBlockSerializer(serializers.ModelSerializer):
    current_version = serializers.SerializerMethodField()

    class Meta:
        model = Block
        fields = ['id', 'position', 'current_version']

    def get_current_version(self, obj):
        v = obj.current_version()
        if v:
            data = {'text': v.text, 'author_type': v.author_type}
            if v.author_type == 'ai':
                decision = (
                    v.decisions.select_related('decided_by').first()
                )
                if decision:
                    data['approved_by'] = decision.decided_by.username
                    data['decision_type'] = decision.decision_type
            return data
        return None


class PublicDocumentSerializer(serializers.ModelSerializer):
    blocks = PublicBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'description', 'blocks']


class OnboardingDocumentSerializer(serializers.ModelSerializer):
    block_count = serializers.SerializerMethodField()
    access_role = serializers.SerializerMethodField()
    owner_username = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'status',
            'created_at', 'updated_at', 'is_onboarding',
            'block_count', 'access_role', 'owner_username',
        ]

    def get_block_count(self, obj):
        return obj.blocks.count()

    def get_access_role(self, obj):
        return getattr(obj, 'access_role', 'onboarding_guest')

    def get_owner_username(self, obj):
        return obj.created_by.username
