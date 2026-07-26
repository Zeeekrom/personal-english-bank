# Personal English Bank

[![CI](https://github.com/Zeeekrom/personal-english-bank/actions/workflows/ci.yml/badge.svg)](https://github.com/Zeeekrom/personal-english-bank/actions/workflows/ci.yml)

Personal English Bank stores clean, traceable bilingual sentences from real
conversations and schedules them for daily spaced review.

The current implementation is a local Phase 1 MVP. The application does not
call an AI model, speech service, cloud platform or remote server.

## Phase 1 workflow

```text
MP3 / MP4 ──→ Codex uses a local transcription tool ┐
                                                  ├─→ raw bilingual evidence
Prepared text ─────────────────────────────────────┘
        → Codex translation, cleanup, correction, summary and filtering
        → refined bilingual version
        → *.curated.json package
        → Source + file/date/summary
        → sentence-level Learning Items
        → 1 / 3 / 7 / 14 / 30 day review
        → speak once and click Complete (no speech grading)
```

Codex is the temporary external curator in Phase 1. A future AI workflow will
use the same validated import contract instead of writing directly to the
database.

## Curation rules

- Preserve one English line followed by one Chinese line in both evidence and
  refined versions.
- Keep uncertain transcription or translation in the raw evidence.
- Correct obvious transcription problems, restore complete meaning and remove
  junk in the refined version without inventing facts.
- Only selected `keep` sentences enter the learning database.
- Every sentence must link back to its original file, captured date, source
  summary and sentence position.

The contract is defined in
[`docs/curated-import.schema.json`](docs/curated-import.schema.json), with a
safe example in
[`docs/curated-import.example.json`](docs/curated-import.example.json).

Curated packages can be imported from the configured `TRANSLATION_ROOT` as
`*.curated.json`, or posted directly:

```http
POST /api/imports/curated
Content-Type: application/json
```

Raw TXT, Markdown, MP3 and MP4 files are never imported directly into the
learning database.

## Product capabilities

- Source search by file name, date, summary, English and Chinese
- Source-level raw/refined bilingual evidence and Chinese summary
- Sentence-level source traceability
- Source and Learning Item create/read/update/delete APIs
- Local SQL Server persistence through Prisma migrations
- Fixed-interval daily review with an ungraded completion action
- Real-world usage history and Markdown export
- Versioned API contract for Codex and future AI providers

## Local development

Requirements:

- Node.js 24+
- pnpm 10+
- Docker Desktop

Copy `.env.example` to `.env`, set the local SQL Server password and configure
`TRANSLATION_ROOT`. Then run:

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

Import up to five waiting curated packages:

```powershell
pnpm db:seed
```

## Verification

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

## Data and publication rules

- Files under `TRANSLATION_ROOT` are read-only.
- Raw media, transcript archives, `.env`, local database content, screenshots
  and build output are never committed.
- Every material change updates `CHANGELOG.md`, passes validation, and is
  committed and pushed to the public GitHub repository.
- SQL Server is the application source of truth; the original local files
  remain evidence.

## License

Personal English Bank is available under the MIT License.
