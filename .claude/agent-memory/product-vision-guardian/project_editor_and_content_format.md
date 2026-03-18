---
name: Editor and content format decisions
description: What the vision and codebase say about TipTap, the editing experience, and plain-text/Markdown storage format
type: project
---

The React + TipTap SPA migration is complete as of March 2026. TipTap with the `tiptap-markdown` extension is now the live editor in production.

Content format is Markdown prose throughout:
- `BlockVersion.text` is a TextField storing Markdown
- `Suggestion.text` is a TextField storing Markdown
- TipTap converts between its internal JSON and Markdown at runtime — never stores TipTap JSON in the DB
- The LLM service instructs the model to return Markdown (bold, italic, simple lists permitted; no headings, no HTML)
- Snapshot export assembles blocks into a Markdown file for GitHub

The `SuggestionAcceptWithEditsView` has a guard rejecting payloads where text starts with `{` to prevent accidental TipTap JSON bleed.

Document creation parses `initial_content` by splitting on blank lines into blocks.

**Why:** Plain/Markdown storage keeps data portable, auditable, and human-readable. GitHub export, snapshots, and public views all depend on this.

**How to apply:** Any proposal to store TipTap JSON, HTML, or any binary format in BlockVersion.text is a direct violation of the auditability principle and must be rejected. The Markdown convention is settled — do not reopen without exceptional justification.
