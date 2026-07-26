# Personal English Bank repository rules

## Product authority

- `个人英语语料库_最终规划与技术方案(1).md` is the product and architecture
  authority.
- The current implementation target is the local Phase 1 curated-corpus loop:
  Codex preprocessing, structured bilingual import, source/sentence CRUD, search
  and scheduled review.
- Keep Product Core work ahead of Portfolio Expansion work.

## Fixed technical decisions

- TypeScript monorepo with Next.js, NestJS, Prisma and Microsoft SQL Server.
- Local development uses SQL Server Developer Edition. Production may later use
  Azure SQL Database.
- JSON stored in SQL Server must use `NVARCHAR(MAX)` with validation in
  controlled SQL migrations; do not use Prisma `Json` fields.
- All schema changes use migrations.
- Database writes that affect more than one aggregate use transactions.
- Codex and future AI providers must write through the versioned Curated Import
  Contract, never directly to application tables.

## Curation and data safety

- Never modify, rename, move or delete files under `TRANSLATION_ROOT`.
- Phase 1 accepts MP3/MP4 or prepared text outside the application. Codex uses a
  local transcription tool for media, then produces raw and refined bilingual
  versions.
- Raw evidence preserves uncertainty. Refined content corrects recoverable
  problems and removes junk without inventing facts.
- Only selected refined sentences enter the learning database.
- Every learning item remains traceable to its source file, source date and
  sentence segment.
- Do not infer pronunciation faults from text alone.
- The running Phase 1 application must not call an AI or cloud speech service.
- Never commit secrets, transcripts, media, personal data or database contents.
  Use `.env` locally and maintain `.env.example`.

## Engineering quality

- Add tests for import contracts, status transitions, review scheduling and core
  API behavior.
- Use idempotent imports based on content hashes.
- Store times in UTC and calculate user-facing dates using the configured IANA
  timezone.
- Keep daily review volume bounded.
- Review completion may store user-provided speech text but must not grade it in
  Phase 1.

## Change publication

- Every material code, schema, configuration or documentation change must add an
  entry under `Unreleased` in `CHANGELOG.md`.
- Before publishing changes, run the relevant tests, typecheck, build and smoke
  test when the local API/database are available.
- After validation, commit the intended files and push them to the configured
  GitHub remote. Do not commit `.env`, local databases, transcripts, screenshots,
  build output or other personal data.
