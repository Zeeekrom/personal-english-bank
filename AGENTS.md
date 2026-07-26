# Personal English Bank repository rules

## Product authority

- `个人英语语料库_最终规划与技术方案(1).md` is the product and architecture authority.
- The current implementation target is MVP v0.1 / Phase 1: text import, transcript browsing, manual learning items, scheduled review, and real-world usage logging.
- Keep Product Core work ahead of Portfolio Expansion work.

## Fixed technical decisions

- TypeScript monorepo with Next.js, NestJS, Prisma, and Microsoft SQL Server.
- Local development uses SQL Server Developer Edition. Production later uses Azure SQL Database.
- JSON stored in SQL Server must use `NVARCHAR(MAX)` with validation in controlled SQL migrations; do not use Prisma `Json` fields.
- All schema changes use migrations.
- Database writes that affect more than one aggregate use transactions.

## Data and AI safety

- Never modify, rename, move, or delete files under the configured `TRANSLATION_ROOT`.
- Preserve source text and source-relative paths. Derived learning items must remain traceable to source segments.
- Imported transcripts never become learning items automatically.
- Do not infer pronunciation faults from text alone.
- Do not invent or embellish personal facts.
- AI is out of scope for Phase 1. When introduced later, output must be structured, validated, staged, and reviewed before final writes.
- Never commit secrets. Use `.env` locally and maintain `.env.example`.

## Engineering quality

- Prefer a thin vertical slice over broad infrastructure.
- Add tests for parsing, status transitions, review scheduling, and core API behavior.
- Use idempotent imports based on content hashes.
- Store times in UTC and calculate user-facing review dates using the configured IANA timezone.
- Keep daily review volume bounded.

## Change publication

- Every material code, schema, configuration, or documentation change must add
  an entry under `Unreleased` in `CHANGELOG.md`.
- Before publishing changes, run the relevant tests, typecheck, and build.
- After validation, commit the intended files and push them to the configured
  GitHub remote. Do not commit `.env`, local databases, transcripts, screenshots,
  build output, or other personal data.
