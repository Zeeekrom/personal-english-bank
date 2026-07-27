# Changelog

All notable changes to Personal English Bank are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Every material code, schema, configuration, or documentation change must add an
entry here before it is committed and pushed.

### Changed

- Expanded the curated-folder importer from five sample packages to all waiting
  packages, submitted in bounded batches of 20.
- Updated the product authority and Phase 1 documentation to separate completed
  packages from the external GPT/Curator backlog.
- Updated GitHub Actions to Node 24-compatible major versions to remove runner
  deprecation warnings.
- Replaced raw transcript import and user-side manual selection with a
  Codex-curated bilingual import contract.
- Changed daily review to a speak-once, ungraded completion flow while retaining
  the fixed 1/3/7/14/30-day schedule.
- Updated the product plan to v1.3 and clarified that Phase 1 AI/transcription
  work happens outside the running application.

### Added

- Added a dedicated Project page that explains why the personal corpus exists,
  the real-life learning and self-review loop, four corpus sources, nine content
  domains, current Phase 1 scope, technology stack and extension boundaries.
- Complete source-file storage and untruncated previews for original, raw
  bilingual and refined bilingual text.
- Corpus audit and post-import verification scripts that prove source-text
  equality, bilingual completeness and imported sentence counts without
  publishing personal corpus content.
- DOCX text extraction support for external corpus auditing and curation.
- Versioned `1.0` curated import API, JSON Schema and example package.
- Raw and refined bilingual evidence, source summaries, sentence-level
  curation fields and source/date traceability.
- Search plus create/read/update/delete operations for sources and learning
  items.
- Cascade-safe source deletion and a curated-workflow smoke test.

### Fixed

- Suppressed root-element hydration warnings caused by browser translation
  extensions changing the document language and adding translation classes
  before React hydrates.

## [0.1.0] - 2026-07-26

### Added

- Next.js Web application and NestJS API in a pnpm/Turborepo workspace.
- Prisma schema and controlled migrations for Microsoft SQL Server.
- Read-only TXT, Markdown, and extensionless transcript discovery and import.
- SHA-256 source deduplication and source-to-segment traceability.
- Otter/Notta speaker timestamp, AR glass bilingual, and plain-text parsers.
- Manual speaker confirmation, interaction logs, and learning-item creation.
- Fixed-interval daily review with Again, Hard, Good, and Easy ratings.
- Real-world usage events and Markdown learning-bank export.
- SQL Server JSON and workflow-state constraints.
- Unit tests, an end-to-end smoke test, and browser-level UI verification.
- Public repository policy, MIT License, and GitHub Actions CI.

### Changed

- Split the original cloud-heavy Phase 1 into a local Product Core MVP and a
  later Azure portfolio expansion.
- Replaced machine-specific source paths in versioned files with
  `TRANSLATION_ROOT`.

### Security

- Local `.env`, database data, transcript archives, screenshots, build output,
  and other personal artifacts are excluded from version control.

[Unreleased]: https://github.com/Zeeekrom/personal-english-bank/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Zeeekrom/personal-english-bank/releases/tag/v0.1.0
