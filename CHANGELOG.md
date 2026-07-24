# Changelog

All notable changes to `@taskclan/achilleon` land here. Format follows
[keep-a-changelog](https://keepachangelog.com/en/1.1.0/). Versions
are [semver](https://semver.org).

## 0.5.1 — 2026-07-24

### Changed

- **Docs-only ship** — `CHANGELOG.md` is now included in the published tarball so it renders on the npm package page. No code changes.

## 0.5.0 — 2026-07-23

### Added

- **New agent capabilities** in the schema: `video`, `audio`, `documents`.
  Alongside the existing `tool_use`, `vision`, and `extended_thinking`, agents
  can now declare they accept video / audio inputs or document uploads. The
  runtime routes these declarations through T1 Max's video / audio primary
  (Gemini 2.5 Pro) when appropriate.

### Changed

- `AgentCapability` TypeScript union type in `dist/index.d.ts` extended to
  include the three new values.

## 0.4.0 — 2026-07-22

### Added

- **`prompts/*.yml` kind** — parameterised prompt templates as a third
  registry alongside skills and agents. Each template declares its variables
  (name, description, required, default) and gets exported per-editor.

## 0.3.0 — 2026-07-22

### Added

- **npm publish** — `@taskclan/achilleon` now installable via
  `npm i @taskclan/achilleon`. Ships pre-built dist/ bundles per editor
  (Cursor, Continue.dev, Claude Code, Windsurf, Cline, Zed, raw markdown) plus
  typed JS entrypoints and a JSON registry.
- **CI drift check** — `npm run export` on every commit; fails the build if
  `dist/` differs from the source YAML.

## 0.2.0 — 2026-07-21

### Added

- **Exporters** for Windsurf, Cline, and Zed alongside the initial Cursor +
  Continue.dev + Claude Code targets.

## 0.1.0 — 2026-07-21

### Added

- **Initial registry.** 12 skills + 2 agents as YAML files, validated against
  a JSON Schema (Ajv), exported to Cursor + Continue.dev + Claude Code
  editor-specific bundles via `scripts/export.mjs`.
