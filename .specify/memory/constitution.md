<!--
Sync Impact Report
- Version change: 2.0.0 → 2.1.0 (MINOR: expanded zero-legacy-brand rule across
  source, specs, scripts, packaging, and docs)
- Modified principles: none renamed; V unchanged in title
- Added / expanded: Technical Constraints — full ban on legacy brand
  identifiers (rentv / Ren-TV / RenTV and equivalents) in the project tree;
  Development Workflow — compliance check before release
- Removed sections: none
- Follow-up TODOs: purge remaining legacy identifiers from application
  source, package metadata, scripts, and feature specs (deferred outside
  this constitution-only command)
-->

# TrackDefault Constitution

## Core Principles

### I. Metadata-Only Mutation
The product promise is non-negotiable: default audio track changes MUST be
applied via container metadata edit (`mkvpropedit` or equivalent header
tools). Remux, re-encode, or full-file rewrite MUST NOT be introduced for
the default-track workflow. Scan MUST read headers only (`ffprobe` /
equivalent) and MUST NOT decode media streams. Rationale: users rely on
fast, lossless batch updates of existing MKV files.

### II. Electron Security Boundary
Renderer MUST run with `contextIsolation: true`, `nodeIntegration: false`,
and sandbox enabled. All filesystem and process work MUST go through a
narrow preload IPC API. The renderer MUST NOT gain arbitrary Node or shell
access. New IPC channels MUST be purpose-scoped and validated on the main
process side. Rationale: the app touches user media folders; privilege
creep is a defect, not a convenience.

### III. Bundled Media Helpers
`ffprobe` and `mkvpropedit` (or documented successors) MUST ship inside
the distributed application for every supported OS build. End users MUST
be able to download a build and complete scan/apply without installing
system-wide media utilities. Packaged builds MUST prefer the bundled
binaries. If bundled helpers are missing or unusable, the app MUST fail
early with a clear, actionable message—silent success is forbidden.
PATH or common-install discovery MAY be used only as a development
fallback, never as the sole release strategy. Rationale: “download and
run” is a product requirement, not an optional convenience.

### IV. Visible Progress & Partial Success
Long-running scan and apply operations MUST stream human-readable log
lines to the UI. Batch apply MUST continue after a per-file failure when
other files remain; each skip or error MUST appear in the journal.
Cancellation and busy-state locks MUST prevent overlapping jobs on the
same session. Rationale: batch media work is only trustworthy when
progress and partial outcomes are visible.

### V. Single-Purpose Cross-Platform Simplicity
The app MUST remain a focused desktop utility on **Windows and macOS**:
choose a folder (optional recurse), list distinct audio tracks across
MKV files, set one as default. Features that broaden scope (players,
converters, cloud sync, multi-format rewrite pipelines, Linux as a
required target) require an explicit constitution amendment before
implementation. Prefer the smallest change that preserves the UX
contract. Public positioning MUST describe TrackDefault as a lightweight
download-and-use tool. Rationale: YAGNI keeps builds small and the
workflow obvious on both supported platforms.

## Technical Constraints

- Stack baseline: Electron main/preload (CommonJS), React + Vite renderer
  (ESM), packaging via electron-builder (or equivalent) producing
  ready-to-run **Windows** and **macOS** artifacts that include bundled
  media helpers.
- Product identity: **TrackDefault** only. Application id, package name,
  productName, artifact names, window titles, IPC bridge global, module
  filenames, and scripts MUST use TrackDefault (or neutral `trackdefault`)
  naming.
- **Zero legacy brand**: Identifiers from the former product
  (`rentv`, `Ren-TV`, `RenTV`, “Ren-TV Selector”, and Cyrillic equivalents
  such as «Рен-ТВ») MUST NOT remain in application source, preload/IPC
  surfaces, package metadata, feature specs, helper scripts, docs, or
  release artifacts. Mentions are allowed only as a one-line compliance
  ban (this rule) or in a temporary Sync Impact Report. Track-matching
  heuristics MUST NOT hard-code that channel brand as the product’s
  purpose.
- UI copy and user-facing logs MUST support Russian (Cyrillic) correctly;
  PowerShell/Node helper scripts that emit text MUST use UTF-8 with BOM
  when written for Windows consoles. Public repository marketing copy
  SHOULD prioritize English discoverability (SEO-friendly short
  description) while remaining contribution-friendly.
- Source layout MUST keep UI, application shell, media scan, media apply,
  shared tooling, and packaging/release concerns in separate modules—
  not a handful of undifferentiated files.
- Media scope for the core workflow: MKV containers. Expanding formats
  requires plan + constitution review if it implies remux or new tools.
- Public GitHub presence (publisher `fckreg`) MUST follow app-publishing
  norms: focused README, changelog, clear release/build layout, and no
  unrelated clutter in the published tree.

## Development Workflow

- Feature work follows Spec Kit: specify → plan → tasks → implement;
  constitution compliance is checked at plan and review time.
- IPC contracts between preload and main are part of the public surface
  between processes: changing them requires updating both ends in the
  same change set; renames away from legacy brand MUST update all ends
  together.
- Before release, a repo-wide search MUST confirm zero leftover legacy
  brand identifiers outside this constitution’s compliance wording and
  any temporary Sync Impact Report.
- Manual verification gate before release (each OS artifact): pick
  folder → scan tracks → apply default → confirm journal and that media
  was not remuxed; additionally verify scan/apply on a machine without
  system-wide media utilities using only the shipped bundle.
- Prefer local fix/remediation over adding new dependencies; any new
  native or network capability needs explicit justification in the plan.
- Cross-platform packaging and helper bundling changes MUST be planned
  and reviewed together so neither OS ships without working helpers.

## Governance

This constitution supersedes informal habits and ad-hoc shortcuts.
Amendments MUST update `.specify/memory/constitution.md`, bump
`CONSTITUTION_VERSION` using semver (MAJOR: remove/redefine principles;
MINOR: add/expand; PATCH: clarify wording), set **Last Amended** to the
amendment date, and include a temporary Sync Impact Report HTML comment
for human review (remove before commit if desired).
All plans, PRs, and implementation reviews MUST verify compliance with
Core Principles I–V. Unjustified complexity or scope expansion MUST be
rejected or deferred to a constitution amendment. Runtime feature
guidance lives in Spec Kit artifacts under `.specify/` and feature specs;
when guidance conflicts with this document, this document wins.

**Version**: 2.1.0 | **Ratified**: 2026-11-24 | **Last Amended**: 2026-11-24
