# MVP Design & Technical Architecture

## Goal

Build a minimal system that validates the core loop:

```
write text
→ AI proposes changes
→ collaborators review
→ humans approve
→ document lineage recorded
→ snapshot exported
```

The system must prioritize:

* transparency
* simplicity
* low operational cost
* compatibility with AI-assisted coding

---

## Tech stack

Backend

* Django
* PostgreSQL

Frontend

* Django templates
* HTMX
* Alpine.js
* TipTap editor

Deployment

* GitHub
* GitHub Actions
* Railway

LLM integration

* OpenAI / Claude APIs
* thin service layer

---

## Why this stack

The primary challenge is **workflow modeling**, not frontend rendering.

A Django monolith with HTMX keeps the system:

* simple
* maintainable
* cheap to operate

This also allows fast iteration with agent-assisted development.

---

## Core entities

### Document

Represents a single policy or proposal draft.

Fields:

```
id
title
description
status
created_by
created_at
updated_at
```

---

### Block

A paragraph or structural block of text.

Fields:

```
id
document_id
position
current_text
created_by
created_at
```

---

### BlockVersion

Represents a proposed version of a block.

Fields:

```
id
block_id
text
author_type (human / ai)
author_id
based_on_version
created_at
```

---

### Suggestion

Represents AI-generated suggestions.

Fields:

```
id
block_id
suggestion_type
text
created_at
```

---

### Decision

Human decision over a suggestion or proposed version.

Fields:

```
id
version_id
decision_type
decided_by
created_at
```

Decision types:

```
accept
reject
accept_with_edits
```

---

### Snapshot

Stable exported version of the document.

Fields:

```
id
document_id
version_number
text
created_at
```

Snapshots represent **Git export moments**.

---

### AuditEvent

Append-only event log.

Tracks:

* edits
* suggestions
* decisions
* exports

---

## Editing model

Documents are composed of **blocks** (paragraphs).

Each block has:

```
block
  → versions
  → suggestions
  → decisions
```

This allows paragraph-level lineage.

---

## LLM integration

LLM outputs always create **suggestions**, never direct edits.

Example workflow:

```
user selects paragraph
→ ask AI rewrite
→ suggestion created
→ user accepts/rejects
```

Accepted suggestions create a new block version.

---

## Git integration principle

Git is **not the collaboration engine.**

Git is used for:

* publication
* interoperability
* durable audit artifacts

Snapshots exported to Git become commits.

---

## Export structure

Example repository:

```
docs/proposal-001.md
.meta/snapshot-003.json
.meta/lineage-003.json
CHANGELOG.md
```

Commit messages describe accepted changes.

---

## Deployment architecture

```
browser
  ↓
django app
  ↓
postgres
```

LLM requests handled via backend service layer.

Static files served by Django/WhiteNoise.

---

## MVP constraints

Do not build yet:

* real-time collaborative editing
* graph visualization
* voting systems
* consensus algorithms
* complex governance rules