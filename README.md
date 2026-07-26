# Personal English Bank

[![CI](https://github.com/Zeeekrom/personal-english-bank/actions/workflows/ci.yml/badge.svg)](https://github.com/Zeeekrom/personal-english-bank/actions/workflows/ci.yml)

Personal English Bank turns real transcript fragments into simple English that
can be reviewed and used in real conversations.

The current implementation is MVP v0.1 / Phase 1. It deliberately excludes AI
and Azure deployment so the learning loop can be validated first.

## Implemented workflow

```text
Translation folder
→ read-only text import
→ Source / Asset / Transcript / Segment
→ manual speaker confirmation
→ manual Learning Item
→ 1 / 3 / 7 / 14 / 30 day review
→ real-world usage log
→ Markdown export
```

Supported imports in Phase 1:

- `.txt`
- `.md`
- text files without an extension

DOCX is discovered in the source archive but will be added through a separate
adapter after the text workflow is stable.

## Local development

Requirements:

- Node.js 24+
- pnpm 10+
- Docker Desktop

Copy `.env.example` to `.env` and set a local SQL Server password and the
Translation folder path. Then run:

```powershell
docker compose up -d
pnpm install
pnpm db:deploy
pnpm db:generate
pnpm dev
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/dashboard`

To import the five representative transcript files:

```powershell
pnpm db:seed
```

The import is idempotent. Re-running it reports each existing file as a
duplicate based on SHA-256 content hashes.

## Verification

```powershell
pnpm test
pnpm typecheck
pnpm build
```

## Data rules

- Files under the configured `TRANSLATION_ROOT` are read only.
- Imported source text never becomes a learning item automatically.
- Every learning item links back to its source and selected segment.
- SQL Server stores structured JSON as validated `NVARCHAR(MAX)`, not Prisma
  `Json`.
- All times are stored in UTC. The configured user timezone is
  `Australia/Hobart`.

## Change log and publication

Every material change must update `CHANGELOG.md`, pass the relevant validation,
and be committed and pushed to the public GitHub repository. Local transcripts,
database contents, `.env` files, screenshots and build output stay private.

## License

Personal English Bank is available under the MIT License.
