---
name: React + TipTap SPA architectural evolution
description: Planned transition from Django templates + HTMX to React SPA + DRF API, with vision risks and approved UX improvements documented
type: project
---

The product is planned to evolve from a Django monolith (templates + HTMX) to
a React + TipTap SPA backed by Django REST Framework. The design plan is in
`design/MVP.md` and `design/SPECS.md`.

**Key architectural decisions made:**
- Django data model (Document, Block, BlockVersion, Suggestion, Decision,
  Snapshot, AuditEvent) is the source of truth — unchanged
- Content format: Markdown prose stored in `BlockVersion.text` TextField
  (upgrading from plain text convention, no schema change)
- Frontend package lives in `frontend/` at repo root (Vite + React + TS)
- All API endpoints under `/api/v1/`
- Auth: session cookies first (same-origin SPA), JWT added later for
  non-browser clients
- TipTap used as single-user rich text editor per block; NO collaborative
  extensions (Y.js, Hocuspocus), NO AI completion extensions

**Vision risks explicitly identified and mitigated in design/MVP.md:**
- TipTap collaborative editing extensions (Y.js) must never be used
- TipTap AI completion/ghost text extensions must never be used
- No "accept all" bulk endpoint — ever
- No optimistic UI that treats a suggestion as accepted before server confirms
- TipTap JSON must never be stored as BlockVersion.text (only Markdown)

**Approved UX improvements (vision-safe):**
- Inline word-level diff preview (informational only, does not skip decision)
- Keyboard shortcuts to trigger suggestion types (not to auto-accept)
- Bulk reject only (bulk accept is prohibited)
- Focus mode (accept/reject UI still required and visible)
- Suggestion queue panel (still requires per-suggestion decisions)
- Optimistic UI for cosmetic feedback only (server remains authority)

**Prohibited UX patterns (explicitly documented):**
- Accept all button
- Auto-accept on timeout or inactivity
- Smart defaults pre-selecting accept
- Ghost text / Copilot-style inline completion
- Undo that silently deletes a Decision record

**Phased migration:**
1. DRF API alongside existing templates (no user-visible change)
2. React SPA for document editing only
3. Full SPA migration
4. Optional: extract frontend as standalone deployment

**Why:** Adoption barrier — policy teams expect modern writing tool UX. The
vision is unchanged; the delivery mechanism is improved.

**How to apply:** Any PR touching the frontend or API layer must be evaluated
against design/MVP.md and design/SPECS.md. The Decision enforcement boundary
(Specs 015–017, 020) is the most critical review surface.
