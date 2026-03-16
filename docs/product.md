# Product Brief / Vision

## Title

**Pull Requests for Prose — Accountable AI for Political and Policy Drafting**

## Summary

Political groups, policy teams, and legislative bodies increasingly use AI to help draft proposals, amendments, and policy documents.

AI dramatically accelerates drafting, but it introduces a new problem: **loss of accountability.**

After several rounds of AI rewrites and human edits, teams often cannot answer simple questions:

* Who originally proposed this wording?
* Did this paragraph come from AI or from a human?
* What objections were raised?
* How was the compromise reached?
* Who approved the final version?

For political and policy documents, those questions matter.

This project explores a drafting environment where **AI can help write, but every change remains accountable.**

Instead of silently rewriting text, AI suggestions behave like **pull requests for prose**: proposed changes that must be accepted by a human before entering the canonical document.

---

## Core idea

Treat text drafting the way software teams treat code.

Every paragraph evolves through visible steps:

```
Original wording — Raul
AI rewrite suggestion
Objection — Ana
AI compromise proposal
Accepted by — Raul & Ana
```

At any moment a reader can inspect a paragraph and see **how it evolved and who approved the final wording.**

---

## Core rule

**Nothing enters the canonical document without a recorded human decision.**

AI proposes changes.
Humans approve them.

This makes AI a **visible contributor**, not an invisible ghostwriter.

---

## Why this matters for politics and policy

Many political and policy processes rely on collaborative drafting:

Examples:

* legislative amendment rounds
* policy commission reports
* coalition agreements
* party manifestos
* committee recommendations
* regulatory proposals
* public consultation documents

These processes often involve:

* negotiating wording
* proposing amendments
* resolving objections
* producing compromise text

But the drafting tools used today (Google Docs, Word, Markdown files, chat tools) make the **evolution of the text opaque**.

The result is often confusion about:

* who authored what
* which wording was negotiated
* which proposals were rejected
* which compromises were accepted

AI-assisted drafting increases this opacity unless provenance is captured.

---

## What the system does

The system provides a drafting environment where:

* people write normally
* AI can propose improvements or alternatives
* collaborators propose edits or raise objections
* AI can suggest compromise wording
* humans explicitly approve the final version

Behind the scenes, the system records the **lineage of the text**.

Users do not need to structure arguments or label claims.

Traceability is captured automatically from the editing workflow.

---

## A clear boundary

The system records provenance for all work performed **inside the drafting environment**.

It cannot track AI use outside the tool (for example text generated in ChatGPT and pasted manually).

Instead, it creates a workflow where using built-in AI suggestions is easier and produces transparent provenance.

Over time, teams naturally prefer the path where contributions are visible and reviewable.

---

## Intended users

Initial users are small teams drafting politically or institutionally significant documents.

Examples:

* political party policy teams
* parliamentary or legislative staff
* public policy commissions
* advocacy organizations drafting proposals
* coalition negotiation teams
* regulatory drafting groups

These environments already involve collaborative drafting and amendment processes.

The system adds **AI assistance with explicit provenance.**

---

## Initial use cases

Examples of real workflows:

### Legislative amendment drafting

A policy team proposes amendments to a bill.
AI assists with wording, and each amendment’s lineage is visible.

### Commission reports

A working group drafts a report with multiple authors.
Disagreements and compromise text are recorded transparently.

### Party manifestos

Policy teams collaborate on sections of a manifesto while maintaining traceable authorship.

### Coalition agreements

Negotiation teams produce compromise wording with visible provenance.

---

## Why now

Large language models dramatically accelerate drafting and rewriting.

But they also introduce **opacity** into collaborative writing.

As AI becomes part of serious drafting workflows, political and policy institutions will increasingly need tools that answer:

* What exactly did the AI contribute?
* Which wording did humans explicitly approve?
* How did the final text evolve?

This project explores the idea that:

**AI-assisted political drafting should be transparent by default.**

---

## Long-term direction

If the core drafting loop proves useful, the system could later support:

* structured amendment rounds
* branching proposals
* evidence and citation attachments
* facilitation workflows
* analysis of how consensus emerges

But the initial goal is simple:

**make AI-assisted collaborative drafting accountable.**

---

## One-line summary

> A drafting environment for policy and political proposals where AI suggestions behave like pull requests and every paragraph has a traceable approval history.

