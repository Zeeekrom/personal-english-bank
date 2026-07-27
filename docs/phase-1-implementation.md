# Phase 1 implementation

## Boundary

Phase 1 validates a local curated-corpus and daily-review loop. The running
application has no AI, cloud speech, Azure dependency or remote deployment.

Codex works outside the application as the temporary curator:

1. receive local MP3/MP4 or prepared text;
2. use a local transcription tool when the input is media;
3. create a raw bilingual evidence version;
4. create a corrected and filtered bilingual version;
5. summarize the source and produce a versioned curated JSON package;
6. call the application import API.

The application begins at step 6. A future AI provider must implement the same
contract.

## Storage contract

One curated package creates all records in one SQL transaction:

```text
Source
├── SourceAsset (package and original-file reference)
├── Transcript
│   ├── sourceText   = complete extracted source file
│   ├── originalText = complete raw bilingual evidence
│   ├── cleanedText  = complete refined bilingual version
│   └── TranscriptSegment[] = kept sentence pairs
└── LearningItem[]
    ├── raw English / Chinese evidence
    ├── refined English / Chinese
    ├── intention, main issue and explanation
    ├── source + segment link
    └── ReviewSchedule
```

The Zod runtime schema and the published JSON Schema both use contract version
`1.0`. Import is idempotent by a SHA-256 hash of the evidence and curated
sentences.

The source detail API and page return and render all three transcript fields
without excerpts, line clamps or pagination. Only `TranscriptSegment[]` is
filtered to the sentences selected for review.

Folder imports accept at most 20 packages per API transaction request. The
repository import script discovers every waiting package and submits as many
20-package batches as necessary.

## CRUD

The API exposes:

- `POST /api/imports/curated` — create a source and its curated sentences;
- `GET /api/sources` and `GET /api/sources/:id`;
- `PATCH /api/sources/:id` and `DELETE /api/sources/:id`;
- `GET /api/learning-items` and `GET /api/learning-items/:id`;
- `PATCH /api/learning-items/:id` and `DELETE /api/learning-items/:id`.

Deleting a source also deletes its source-only learning items, schedules,
review events, usage events, transcript data and assets. Shared learning items
are unlinked rather than deleted.

## Review rules

The first review is scheduled one day after import. Completion advances through
1, 3, 7, 14 and 30-day steps. The normal UI action is:

1. read the Chinese prompt;
2. say the English sentence once;
3. optionally paste a Whisper or other speech-to-text result;
4. click **Complete and continue**.

The application stores the optional response but performs no semantic,
pronunciation or correctness check. The existing rated endpoint remains
available for future advanced scheduling, while Phase 1 uses the ungraded
completion endpoint.

## Components

- `apps/web`: Next.js source, sentence and review interface
- `apps/api`: NestJS HTTP API and curated import boundary
- `packages/domain`: Zod contracts and scheduling rules
- `packages/database`: Prisma SQL Server client
- `prisma`: schema and controlled SQL migrations

Phase 1.5 begins only after this local workflow is used with real curated
sources. Azure hosting and runtime AI integration remain later phases.
