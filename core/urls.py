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

    # --- Public SPA entry point ---
    path(
        'p/<uuid:token>/',
        views.public_spa_shell,
        name='document_public',
    ),
    path('robots.txt', views.robots_txt, name='robots_txt'),
    path('sitemap.xml', views.sitemap_xml, name='sitemap_xml'),
]
