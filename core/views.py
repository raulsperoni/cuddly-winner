import html

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.html import strip_tags
from django.utils.text import Truncator

from .models import (
    Document, DocumentMembership,
)


def _get_document_access(document, user):
    if document.created_by_id == user.id:
        return 'owner'
    membership = DocumentMembership.objects.filter(
        document=document, user=user
    ).first()
    if membership:
        return membership.role
    return None


@login_required
def spa_shell(request, **kwargs):
    return render(
        request,
        'core/document_editor_shell.html',
        {
            'debug': settings.DEBUG,
            'current_username': request.user.username,
        },
    )


@login_required
def document_editor_spa(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if not _get_document_access(doc, request.user):
        return HttpResponse('Forbidden', status=403)
    return render(
        request,
        'core/document_editor_shell.html',
        {
            'document': doc,
            'debug': settings.DEBUG,
            'current_username': request.user.username,
        },
    )


def public_spa_shell(request, token):
    doc = get_object_or_404(Document, public_token=token)
    blocks = []
    for block in doc.blocks.order_by('position'):
        version = block.current_version()
        blocks.append(
            {
                'position': block.position,
                'text': version.text if version else '',
            }
        )

    first_text = next((b['text'] for b in blocks if b['text'].strip()), '')
    meta_description_source = doc.description.strip() or first_text
    meta_description = Truncator(strip_tags(meta_description_source)).chars(160)
    canonical_url = request.build_absolute_uri()
    title = doc.title or 'Shared document'

    return render(
        request,
        'core/public_document.html',
        {
            'document': doc,
            'blocks': blocks,
            'canonical_url': canonical_url,
            'meta_title': f'{title} · DraftingDocs',
            'meta_description': meta_description or 'Public drafting document',
            'meta_robots': (
                'index, follow'
                if doc.status == Document.STATUS_PUBLISHED
                else 'noindex, nofollow'
            ),
            'current_username': (
                request.user.username if request.user.is_authenticated else ''
            ),
        },
    )


def robots_txt(request):
    return HttpResponse(
        '\n'.join(
            [
                'User-agent: *',
                'Allow: /p/',
                'Disallow: /accounts/',
                'Disallow: /api/',
                'Disallow: /documents/',
                'Disallow: /join/',
                f'Sitemap: {request.build_absolute_uri("/sitemap.xml")}',
                '',
            ]
        ),
        content_type='text/plain',
    )


def sitemap_xml(request):
    public_docs = Document.objects.filter(
        status=Document.STATUS_PUBLISHED
    ).order_by('-updated_at')
    items = ''.join(
        (
            '<url>'
            f'<loc>{html.escape(request.build_absolute_uri(reverse("document_public", kwargs={"token": doc.public_token})))}</loc>'
            f'<lastmod>{doc.updated_at.date().isoformat()}</lastmod>'
            '</url>'
        )
        for doc in public_docs
    )
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f'{items}'
        '</urlset>'
    )
    return HttpResponse(body, content_type='application/xml')


def join_document(request, invite_token):
    doc = get_object_or_404(Document, invite_token=invite_token)

    if isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
        signup_url = reverse('account_signup')
        next_url = reverse('document_join', kwargs={'invite_token': invite_token})
        return redirect(f'{signup_url}?next={next_url}')

    access = _get_document_access(doc, request.user)
    editor_url = reverse('document_editor_spa', kwargs={'pk': doc.pk})
    if access:
        return redirect(f'{editor_url}?join_status=already-has-access')

    DocumentMembership.objects.create(
        document=doc,
        user=request.user,
        role=DocumentMembership.ROLE_COLLABORATOR,
    )
    return redirect(f'{editor_url}?join_status=joined')
