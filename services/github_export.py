import base64
import json
import os
from datetime import datetime

import requests


def push_snapshot(
    snapshot, repo: str, token: str | None = None
) -> str:
    """
    Push snapshot to GitHub repo. Returns commit SHA.
    repo format: 'owner/repo'
    """
    if not token:
        token = os.environ.get('GITHUB_TOKEN', '')
    if not token:
        raise ValueError('GitHub token required')

    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github+json',
    }
    base_url = f'https://api.github.com/repos/{repo}'
    doc = snapshot.document
    safe_title = doc.title.lower().replace(' ', '-')[:50]
    doc_path = f'docs/{safe_title}.md'
    meta_path = f'.meta/snapshot-{snapshot.version_number:03d}.json'

    metadata = {
        'snapshot_version': snapshot.version_number,
        'document_title': doc.title,
        'exported_at': datetime.utcnow().isoformat() + 'Z',
        'created_by': snapshot.created_by.username,
        **snapshot.metadata,
    }

    commit_sha = _upsert_file(
        base_url, headers, doc_path,
        snapshot.text,
        f'snapshot: {doc.title} v{snapshot.version_number}',
    )
    _upsert_file(
        base_url, headers, meta_path,
        json.dumps(metadata, indent=2),
        f'meta: snapshot {snapshot.version_number} metadata',
    )
    return commit_sha


def _upsert_file(
    base_url: str,
    headers: dict,
    path: str,
    content: str,
    message: str,
) -> str:
    url = f'{base_url}/contents/{path}'
    existing = requests.get(url, headers=headers)
    payload: dict = {
        'message': message,
        'content': base64.b64encode(content.encode()).decode(),
    }
    if existing.status_code == 200:
        payload['sha'] = existing.json()['sha']
    resp = requests.put(url, headers=headers, json=payload)
    resp.raise_for_status()
    return resp.json()['commit']['sha']
