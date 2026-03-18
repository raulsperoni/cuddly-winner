---
name: React + TipTap SPA architectural evolution
description: SPA migration is complete as of March 2026 — key decisions, approved UX patterns, and prohibited patterns that are now live
type: project
---

The React + TipTap SPA migration is complete. The HTMX/Django-template layer is gone. The codebase as of March 2026 is fully SPA-based.

**Live architecture:**
- Django handles auth (allauth), API (DRF under `/api/v1/`), join flow (`/join/<token>/`), and static file serving (WhiteNoise)
- React SPA (Vite + TypeScript + react-router-dom) is the full editor surface, served via `spa_shell` Django view
- Session-cookie auth, same-origin deployment (Railway)
- TipTap with `tiptap-markdown` extension — NO Y.js, NO collaborative extensions, NO AI ghost-text extensions

**Approved live UX patterns:**
- SuggestionPanel: two-column view (current paragraph vs proposed revision with DiffView) with explicit Approve / Revise & approve / Reject buttons
- AuthorshipBadge on every block: "Human draft" or "AI draft approved by [user]"
- LineagePanel (collapsible "Review trail") per block: shows version history and Decision records
- BlockItem with hover-reveal suggestion type buttons (Clarify / Rephrase / Condense / Expand)
- DocumentHistory page as chronological audit event timeline with human-readable descriptions

**Prohibited patterns (still enforced):**
- No bulk accept endpoint — explicitly prohibited in specs.md
- No auto-accept or smart defaults pre-selecting suggestions
- No TipTap JSON storage in BlockVersion.text
- No Y.js or Hocuspocus collaborative editing extensions

**Why:** Vision unchanged; delivery mechanism modernised for institutional users.

**How to apply:** New frontend features must call DRF API. The SuggestionPanel accept/reject/accept-with-edits triad is the core interaction — any proposal that bypasses, simplifies, or merges those three actions needs product owner review.
