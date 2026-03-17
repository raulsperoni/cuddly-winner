from django.urls import path

from core.api import views

urlpatterns = [
    # Documents
    path(
        'documents/',
        views.DocumentListCreateView.as_view(),
        name='api-document-list',
    ),
    path(
        'documents/<int:pk>/',
        views.DocumentDetailView.as_view(),
        name='api-document-detail',
    ),
    path(
        'documents/<int:pk>/history/',
        views.DocumentHistoryView.as_view(),
        name='api-document-history',
    ),

    # Blocks
    path(
        'documents/<int:pk>/blocks/',
        views.BlockListCreateView.as_view(),
        name='api-block-list',
    ),
    path(
        'documents/<int:pk>/blocks/reorder/',
        views.BlockReorderView.as_view(),
        name='api-block-reorder',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/',
        views.BlockDetailView.as_view(),
        name='api-block-detail',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/split/',
        views.BlockSplitView.as_view(),
        name='api-block-split',
    ),

    # Block versions
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/versions/',
        views.BlockVersionListView.as_view(),
        name='api-block-versions',
    ),

    # Suggestions
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/suggestions/',
        views.SuggestionListCreateView.as_view(),
        name='api-suggestion-list',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>'
        '/suggestions/<int:suggestion_pk>/accept/',
        views.SuggestionAcceptView.as_view(),
        name='api-suggestion-accept',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>'
        '/suggestions/<int:suggestion_pk>/accept-with-edits/',
        views.SuggestionAcceptWithEditsView.as_view(),
        name='api-suggestion-accept-with-edits',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>'
        '/suggestions/<int:suggestion_pk>/reject/',
        views.SuggestionRejectView.as_view(),
        name='api-suggestion-reject',
    ),

    # Snapshots
    path(
        'documents/<int:pk>/snapshots/',
        views.SnapshotListCreateView.as_view(),
        name='api-snapshot-list',
    ),
    path(
        'documents/<int:pk>/snapshots/<int:snapshot_pk>/export/',
        views.SnapshotExportView.as_view(),
        name='api-snapshot-export',
    ),

    # Public read-only
    path(
        'public/<uuid:token>/',
        views.PublicDocumentView.as_view(),
        name='api-public-document',
    ),
]
