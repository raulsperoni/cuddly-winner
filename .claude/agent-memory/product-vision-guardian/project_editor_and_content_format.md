---
name: Editor and content format decisions
description: What the product vision and codebase say about the editing experience, editor choice, and text storage format
type: project
---

TipTap editor is listed as the intended frontend editor in docs/mvp_design.md, but as of March 2026 the implementation uses a plain HTML textarea (not TipTap). The editing experience is block-by-block using Django templates + HTMX + Alpine.js — no rich text editor is currently in place.

Content format is plain text throughout:
- BlockVersion.text is a TextField (plain text)
- Suggestion.text is a TextField (plain text)
- The LLM service explicitly instructs the model to return "plain prose only — no markdown, no bullet points"
- Snapshot export assembles blocks into a markdown file for GitHub, but the canonical storage is plain text

Document creation supports pasting existing content as plain text, split by blank lines into blocks.

Editing interactions:
- Click a paragraph to open a textarea in-place
- Enter splits the block at cursor position
- Shift+Enter inserts a line break
- Cmd/Ctrl+Enter or focusout (if changed) saves
- Esc cancels

**Why:** The tech choice of TipTap in the design doc was never implemented. Plain textarea keeps things simple and avoids rich-text format ambiguity, which is consistent with the product's emphasis on plain prose for policy documents.

**How to apply:** Any proposal to introduce a rich-text editor (TipTap, ProseMirror, Quill, etc.) must be evaluated carefully. It would force a decision about storing HTML vs. markdown vs. plain text. The current plain-text model is clean and auditable — a change needs strong justification and must not compromise the accept/reject workflow or the lineage trail.

**Update (2026-03-17):** The React + TipTap SPA evolution plan (design/MVP.md) has resolved this question. The approved decision is:
- Store content as Markdown prose in `BlockVersion.text` (no schema change, convention upgrade from "plain text" to "Markdown prose")
- TipTap converts between its internal JSON and Markdown using a serializer — it never stores TipTap JSON in the database
- The backend must validate that `accept-with-edits` text is not raw JSON (reject if value starts with `{`)
- HTML storage remains prohibited
