from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import F
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string

from .forms import (
    BlockTextForm, DocumentForm, SnapshotExportForm, SuggestForm
)
from .models import (
    AuditEvent, Block, BlockVersion, Decision,
    Document, Snapshot, Suggestion,
)
from services import llm as llm_service
from services import github_export


@login_required
def home(request):
    docs = Document.objects.filter(
        created_by=request.user
    ).order_by('-updated_at')
    return render(request, 'core/home.html', {'documents': docs})


@login_required
def document_create(request):
    if request.method == 'POST':
        form = DocumentForm(request.POST)
        if form.is_valid():
            doc = form.save(commit=False)
            doc.created_by = request.user
            doc.save()
            raw = form.cleaned_data.get('initial_content', '').strip()
            raw = raw.replace('\r\n', '\n').replace('\r', '\n')
            paragraphs = (
                [p.strip() for p in raw.split('\n\n') if p.strip()]
                if raw else ['']
            )
            for i, text in enumerate(paragraphs):
                block = Block.objects.create(
                    document=doc,
                    position=i,
                    created_by=request.user,
                )
                BlockVersion.objects.create(
                    block=block,
                    text=text,
                    author_type=BlockVersion.AUTHOR_HUMAN,
                    author=request.user,
                    is_current=True,
                )
            AuditEvent.objects.create(
                document=doc,
                event_type=AuditEvent.EVT_DOCUMENT_CREATED,
                actor=request.user,
                data={'title': doc.title, 'block_count': len(paragraphs)},
            )
            return redirect('document_detail', pk=doc.pk)
    else:
        form = DocumentForm()
    return render(request, 'core/document_create.html', {'form': form})


@login_required
def document_detail(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    blocks = doc.blocks.prefetch_related('versions', 'suggestions')
    snapshots = doc.snapshots.all()
    export_form = SnapshotExportForm()
    return render(request, 'core/document_detail.html', {
        'document': doc,
        'blocks': blocks,
        'snapshots': snapshots,
        'export_form': export_form,
    })


@login_required
def block_add(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

    last_pos = doc.blocks.order_by('-position').values_list(
        'position', flat=True
    ).first()
    position = (last_pos + 1) if last_pos is not None else 0

    block = Block.objects.create(
        document=doc,
        position=position,
        created_by=request.user,
    )
    text = request.POST.get('text', '')
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
    return render(request, 'core/partials/block_item.html', {
        'block': block,
        'document': doc,
    })


@login_required
def block_edit(request, pk, block_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)

    current = block.current_version()
    original_text = current.text if current else ''

    if request.method == 'GET':
        form = BlockTextForm(initial={'text': original_text})
        return render(request, 'core/partials/block_edit_form.html', {
            'block': block,
            'document': doc,
            'form': form,
            'original_text': original_text,
        })

    form = BlockTextForm(request.POST)
    if form.is_valid():
        new_text = form.cleaned_data['text']
        if new_text != original_text:
            new_version = BlockVersion.objects.create(
                block=block,
                text=new_text,
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
                data={'version_id': new_version.pk},
            )
    return render(request, 'core/partials/block_item.html', {
        'block': block,
        'document': doc,
    })


@login_required
def block_suggest(request, pk, block_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)

    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

    form = SuggestForm(request.POST)
    if not form.is_valid():
        return HttpResponse('Invalid form', status=400)

    suggestion_type = form.cleaned_data['suggestion_type']
    try:
        text = llm_service.get_suggestion(block, suggestion_type)
    except Exception as exc:
        return HttpResponse(
            f'<div class="bg-red-950 border border-red-800 rounded p-3 text-xs'
            f' text-red-300">AI request failed: {exc}</div>'
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
        data={
            'suggestion_id': suggestion.pk,
            'type': suggestion_type,
        },
    )
    return render(request, 'core/partials/suggestion_card.html', {
        'suggestion': suggestion,
        'block': block,
        'document': doc,
    })


@login_required
def suggestion_accept(request, pk, block_pk, suggestion_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)
    suggestion = get_object_or_404(
        Suggestion, pk=suggestion_pk, block=block
    )

    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

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
    )
    suggestion.status = Suggestion.STATUS_ACCEPTED
    suggestion.save()
    AuditEvent.objects.create(
        document=doc,
        event_type=AuditEvent.EVT_SUGGESTION_ACCEPTED,
        actor=request.user,
        block=block,
        data={'suggestion_id': suggestion.pk},
    )
    return render(request, 'core/partials/block_item.html', {
        'block': block,
        'document': doc,
    })


@login_required
def suggestion_reject(request, pk, block_pk, suggestion_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)
    suggestion = get_object_or_404(
        Suggestion, pk=suggestion_pk, block=block
    )

    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

    current = block.current_version()
    Decision.objects.create(
        suggestion=suggestion,
        block_version=current,
        decision_type=Decision.TYPE_REJECT,
        decided_by=request.user,
    )
    suggestion.status = Suggestion.STATUS_REJECTED
    suggestion.save()
    AuditEvent.objects.create(
        document=doc,
        event_type=AuditEvent.EVT_SUGGESTION_REJECTED,
        actor=request.user,
        block=block,
        data={'suggestion_id': suggestion.pk},
    )
    return render(request, 'core/partials/block_item.html', {
        'block': block,
        'document': doc,
    })


@login_required
def snapshot_create(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    if request.method != 'POST':
        return redirect('document_detail', pk=pk)

    lines = []
    lines.append(f'# {doc.title}\n')
    if doc.description:
        lines.append(f'{doc.description}\n')
    lines.append('')
    for block in doc.blocks.all():
        cv = block.current_version()
        if cv and cv.text:
            lines.append(cv.text)
            lines.append('')
    full_text = '\n'.join(lines)

    version = doc.next_snapshot_version
    snapshot = Snapshot.objects.create(
        document=doc,
        version_number=version,
        text=full_text,
        metadata={
            'block_count': doc.blocks.count(),
        },
        created_by=request.user,
    )
    AuditEvent.objects.create(
        document=doc,
        event_type=AuditEvent.EVT_SNAPSHOT_CREATED,
        actor=request.user,
        data={'snapshot_id': snapshot.pk, 'version': version},
    )
    messages.success(request, f'Snapshot v{version} created.')
    return redirect('document_detail', pk=pk)


@login_required
def snapshot_export(request, pk, snapshot_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    snapshot = get_object_or_404(Snapshot, pk=snapshot_pk, document=doc)

    if request.method != 'POST':
        return redirect('document_detail', pk=pk)

    form = SnapshotExportForm(request.POST)
    if not form.is_valid():
        messages.error(request, 'Invalid export form.')
        return redirect('document_detail', pk=pk)

    repo = form.cleaned_data['github_repo']
    token = form.cleaned_data.get('github_token') or None

    try:
        commit_sha = github_export.push_snapshot(snapshot, repo, token)
    except Exception as exc:
        messages.error(request, f'Export failed: {exc}')
        return redirect('document_detail', pk=pk)

    snapshot.github_commit_sha = commit_sha
    snapshot.github_repo = repo
    snapshot.save()
    AuditEvent.objects.create(
        document=doc,
        event_type=AuditEvent.EVT_SNAPSHOT_EXPORTED,
        actor=request.user,
        data={
            'snapshot_id': snapshot.pk,
            'repo': repo,
            'commit_sha': commit_sha,
        },
    )
    messages.success(
        request,
        f'Snapshot exported to {repo} (commit {commit_sha[:7]}).',
    )
    return redirect('document_detail', pk=pk)


@login_required
def block_cancel(request, pk, block_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)
    return render(request, 'core/partials/block_item.html', {
        'block': block,
        'document': doc,
    })


@login_required
def block_split(request, pk, block_pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    block = get_object_or_404(Block, pk=block_pk, document=doc)
    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

    before = request.POST.get('before', '')
    after = request.POST.get('after', '')

    current = block.current_version()
    BlockVersion.objects.create(
        block=block,
        text=before,
        author_type=BlockVersion.AUTHOR_HUMAN,
        author=request.user,
        based_on_version=current,
        is_current=True,
    )

    Block.objects.filter(
        document=doc, position__gt=block.position
    ).update(position=F('position') + 1)

    new_block = Block.objects.create(
        document=doc,
        position=block.position + 1,
        created_by=request.user,
    )
    BlockVersion.objects.create(
        block=new_block,
        text=after,
        author_type=BlockVersion.AUTHOR_HUMAN,
        author=request.user,
        is_current=True,
    )
    AuditEvent.objects.create(
        document=doc,
        event_type=AuditEvent.EVT_BLOCK_CREATED,
        actor=request.user,
        block=new_block,
        data={'position': new_block.position, 'split_from': block.pk},
    )

    ctx = {'document': doc, 'request': request}
    old_html = render_to_string(
        'core/partials/block_item.html',
        {**ctx, 'block': block},
        request=request,
    )
    new_form = BlockTextForm(initial={'text': after})
    new_html = render_to_string(
        'core/partials/block_edit_form.html',
        {
            **ctx,
            'block': new_block,
            'form': new_form,
            'original_text': after,
            'oob': f'afterend:#block-{block.pk}',
        },
        request=request,
    )
    return HttpResponse(old_html + new_html)


@login_required
def document_history(request, pk):
    doc = get_object_or_404(Document, pk=pk)
    if doc.created_by != request.user:
        return HttpResponse('Forbidden', status=403)
    events = doc.audit_events.select_related('actor', 'block').all()
    return render(request, 'core/document_history.html', {
        'document': doc,
        'events': events,
    })


def document_public(request, token):
    doc = get_object_or_404(Document, public_token=token)
    blocks = doc.blocks.prefetch_related('versions')
    return render(request, 'core/document_public.html', {
        'document': doc,
        'blocks': blocks,
    })
