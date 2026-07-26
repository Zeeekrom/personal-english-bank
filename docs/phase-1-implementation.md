# Phase 1 implementation

## Scope

Phase 1 validates one local, manual learning loop before Azure and AI are
introduced.

## Components

- `apps/web`: Next.js user interface
- `apps/api`: NestJS HTTP API
- `packages/domain`: validation and review scheduling rules
- `packages/database`: Prisma SQL Server client
- `prisma`: schema and controlled SQL migrations

There is no worker application in Phase 1.

## Import behavior

The importer reads only from the configured `TRANSLATION_ROOT`. It rejects path
traversal, accepts at most 20 files per request, and supports TXT, Markdown and
extensionless text files.

Each file receives a SHA-256 hash. An existing hash returns `duplicate` without
creating another Source.

Current parser adapters:

1. Otter/Notta-style speaker and timestamp blocks;
2. AR glass English/Chinese alternating blocks;
3. plain paragraph fallback.

Low-quality transcript text remains source evidence. It is never automatically
promoted into the learning bank.

## Review rules

The first review is scheduled one day after creation. A `Good` response advances
through 1, 3, 7, 14 and 30-day steps. `Again` resets to one day; `Hard` shortens
the next step; `Easy` lengthens it. The API caps the daily result using
`DAILY_REVIEW_LIMIT`.

This is intentionally simpler than SM-2. Algorithm changes require review
history migration and explicit product evidence.

## Next boundary

Phase 1.5 starts only after the manual loop is used with real items. It moves
the same application boundary to Azure SQL, Blob Storage and Container Apps
through Terraform.
