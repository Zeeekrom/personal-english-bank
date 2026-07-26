# Changelog

All notable changes to Personal English Bank are recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Every material code, schema, configuration, or documentation change must add an
entry here before it is committed and pushed.

### Changed

- Updated GitHub Actions to Node 24-compatible major versions to remove runner
  deprecation warnings.

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
