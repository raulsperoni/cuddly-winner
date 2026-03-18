# Spec 013 — Export Metadata Bundle

## Objective

Allow a user to download a structured export bundle containing the document
snapshot alongside machine-readable provenance and lineage metadata.

## User story

As a technical user, I want a structured bundle so I can inspect provenance,
build tooling on top of it, or audit the drafting process externally.

## Rules

- Bundle is generated from a selected `Snapshot`.
- Bundle contains four files (see below).
- JSON files are schema-versioned.
- Bundle must not expose `invite_token`, `public_token`, secret keys, or any
  credential.
- All IDs in the bundle are stable and match the application's model IDs.

## Bundle contents

```
{title-slug}-v{version_number:03d}.md
{title-slug}-v{version_number:03d}.annotated.md
{title-slug}-v{version_number:03d}.snapshot.json
{title-slug}-v{version_number:03d}.lineage.json
```

The bundle may be delivered as a zip or as individual file downloads.

## `snapshot.json` minimum fields

```json
{
  "schema_version": 1,
  "export_created_at": "<ISO 8601>",
  "document_id": 42,
  "snapshot_id": 7,
  "snapshot_version_number": 3,
  "title": "Document title",
  "block_count": 12
}
```

## `lineage.json` minimum fields

Field names match the application data model (`decided_by_username` from
`Decision.decided_by`, `author_username` from `BlockVersion.author`).

```json
{
  "schema_version": 1,
  "snapshot_id": 7,
  "blocks": [
    {
      "block_id": 101,
      "position": 0,
      "final_text": "...",
      "committed_versions": [
        {
          "version_id": 201,
          "author_type": "human",
          "author_username": "raul",
          "created_at": "<ISO 8601>",
          "decided_by_username": null
        },
        {
          "version_id": 202,
          "author_type": "ai",
          "author_username": null,
          "created_at": "<ISO 8601>",
          "decided_by_username": "raul"
        }
      ],
      "narrative_note": "Initially drafted by raul. ..."
    }
  ]
}
```

`narrative_note` is `null` if the block does not qualify under Spec 012's
qualifying rule.

## Model notes

No model change required. All data is available from `Snapshot`,
`Block`, `BlockVersion`, and `Decision`.

## Acceptance criteria

- Bundle can be downloaded (zip or individual files).
- JSON validates against the documented minimum schema.
- `snapshot.json` and `lineage.json` reference the same snapshot.
- No sensitive fields are present in either JSON file.
- `narrative_note` is present only for qualifying blocks.
