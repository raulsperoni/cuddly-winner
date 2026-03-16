from django.contrib import admin
from .models import (
    Document, Block, BlockVersion, Suggestion,
    Decision, Snapshot, AuditEvent,
)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'created_by', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'description']


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['id', 'document', 'position', 'created_by', 'created_at']
    list_filter = ['document']


@admin.register(BlockVersion)
class BlockVersionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'block', 'author_type', 'author', 'is_current', 'created_at'
    ]
    list_filter = ['author_type', 'is_current']


@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'block', 'suggestion_type', 'status', 'created_at']
    list_filter = ['suggestion_type', 'status']


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'decision_type', 'decided_by', 'suggestion', 'created_at'
    ]
    list_filter = ['decision_type']


@admin.register(Snapshot)
class SnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'document', 'version_number', 'created_by', 'created_at'
    ]
    list_filter = ['document']


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'document', 'event_type', 'actor', 'created_at'
    ]
    list_filter = ['event_type']
    readonly_fields = [
        'document', 'event_type', 'actor', 'block', 'data', 'created_at'
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
