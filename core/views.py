from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

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
    get_object_or_404(Document, public_token=token)
    return render(request, 'core/document_editor_shell.html', {
        'debug': settings.DEBUG,
        'current_username': (
            request.user.username if request.user.is_authenticated else ''
        ),
    })


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
