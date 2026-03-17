from django.urls import path
from . import views

# SPA routes — React Router handles client-side navigation.
# Django just needs to serve the shell for every entry point.
spa = views.spa_shell

urlpatterns = [
    # --- React SPA entry points ---
    path('', spa, name='home'),
    path('documents/new/', spa, name='document_create'),
    path('documents/<int:pk>/', spa, name='document_detail'),
    path(
        'documents/<int:pk>/edit/',
        views.document_editor_spa,
        name='document_editor_spa',
    ),
    path('documents/<int:pk>/history/', spa, name='document_history'),
    path(
        'join/<uuid:invite_token>/',
        views.join_document,
        name='document_join',
    ),

    # --- HTMX block mutation endpoints (still active) ---
    path(
        'documents/<int:pk>/blocks/add/',
        views.block_add,
        name='block_add',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/edit/',
        views.block_edit,
        name='block_edit',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/suggest/',
        views.block_suggest,
        name='block_suggest',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/cancel/',
        views.block_cancel,
        name='block_cancel',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>/split/',
        views.block_split,
        name='block_split',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>'
        '/suggestions/<int:suggestion_pk>/accept/',
        views.suggestion_accept,
        name='suggestion_accept',
    ),
    path(
        'documents/<int:pk>/blocks/<int:block_pk>'
        '/suggestions/<int:suggestion_pk>/reject/',
        views.suggestion_reject,
        name='suggestion_reject',
    ),
    path(
        'documents/<int:pk>/snapshot/',
        views.snapshot_create,
        name='snapshot_create',
    ),
    path(
        'documents/<int:pk>/snapshots/<int:snapshot_pk>/export/',
        views.snapshot_export,
        name='snapshot_export',
    ),

    # --- Public read-only (stays as Django template) ---
    path(
        'p/<uuid:token>/',
        views.document_public,
        name='document_public',
    ),
]
