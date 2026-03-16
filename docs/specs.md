# Spec-Driven Development

## Spec format

Each spec defines:

* user story
* rules
* acceptance criteria

---

## Spec 001 — Create document

User creates a drafting workspace.

Acceptance criteria:

* title required
* document created
* first block created
* audit event recorded

---

## Spec 002 — Edit block

User edits paragraph.

Acceptance criteria:

* new block version created
* previous version preserved
* audit event recorded

---

## Spec 003 — AI suggestion

User requests AI rewrite.

Acceptance criteria:

* suggestion created
* original text unchanged
* suggestion visible in UI

---

## Spec 004 — Accept suggestion

User accepts AI suggestion.

Acceptance criteria:

* new block version created
* decision recorded
* lineage preserved

---

## Spec 005 — Reject suggestion

User rejects AI suggestion.

Acceptance criteria:

* suggestion marked rejected
* no change to canonical block

---

## Spec 006 — Snapshot export

User exports document snapshot.

Acceptance criteria:

* snapshot created
* markdown generated
* metadata generated
* git export possible

---

## Spec 007 — Lineage inspection

User inspects paragraph history.

Acceptance criteria:

* version chain visible
* AI contributions labeled
* human approvals visible

---

## Spec 008 — Git export

User exports snapshot to Git.

Acceptance criteria:

* snapshot committed
* metadata included
* commit message generated

---

## Spec 009 — Permissions

Roles:

```
owner
contributor
viewer
```

Owner decides suggestions.

---

## Spec 010 — Activity timeline

User can inspect document history.

Acceptance criteria:

* events listed
* chronological order
* linked to blocks

