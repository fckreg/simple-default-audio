# Implementation Plan: TrackDefault Product Release

**Branch**: `001-audio-default-product` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-audio-default-product/spec.md`

## Summary

Ship **TrackDefault** as a modular Electron desktop app (Windows + macOS) that sets the default MKV audio track via metadata-only edits, with **ffprobe** and **mkvpropedit** bundled in each OS build. Align track identity with clarified **normalized language + title** matching. Publish source to `github.com/fckreg/simple-default-audio` (MIT, SEO README, CHANGELOG) and distribute binaries **only** via GitHub Releases; macOS v1 unsigned with documented Gatekeeper steps.

## Technical Context

**Language/Version**: JavaScript — Electron main/preload CommonJS (Node 20+ via Electron 36), React 19 renderer ESM via Vite 6

**Primary Dependencies**: electron, electron-builder, react, react-dom, vite, @vitejs/plugin-react; bundled native helpers ffprobe + mkvpropedit (vendored per OS/arch, not PATH-only)

**Storage**: N/A (in-session scan cache only; no persistent DB)

**Testing**: Manual E2E per [quickstart.md](./quickstart.md); lightweight Node unit checks for track-key normalization (optional during implement); no mandatory UI test framework for v1

**Target Platform**: Windows 10/11 (x64 portable), macOS 12+ (arm64 + x64 or universal zip/dmg), unsigned macOS v1

**Project Type**: Desktop app (Electron)

**Performance Goals**: Responsive UI during batch scan/apply with streamed journal; metadata-only edits (no remux). Soft targets (not yet in spec metrics): cold window ready under a few seconds on typical hardware; keep portable footprint as small as practical while bundling helpers

**Constraints**: Constitution v2.1.0 — metadata-only; Electron security boundary; helpers MUST be bundled; zero legacy brand; Russian UI + English GitHub copy; MKV only; no committed ship binaries in git

**Scale/Scope**: Single-window utility; folders up to hundreds of MKV files; one public GitHub repo + dual-OS release assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Notes |
|------------------------|--------|-------|
| I. Metadata-Only Mutation | PASS | Plan keeps ffprobe header scan + mkvpropedit flag edits only |
| II. Electron Security Boundary | PASS | Retain contextIsolation, sandbox, narrow `trackdefault` preload API |
| III. Bundled Media Helpers | PASS | Design: `extraResources` + resolve from `process.resourcesPath`; PATH only as dev fallback |
| IV. Visible Progress & Partial Success | PASS | Keep process-log IPC + per-file continue-on-error |
| V. Single-Purpose Cross-Platform Simplicity | PASS | Win+macOS, folder→track→default only; lightweight positioning |
| TrackDefault identity / zero legacy brand | PASS | Already renamed in source; gate: repo-wide search before release |
| Modular source layout | PASS | Split `electron/media/*` + UI/shell/packaging areas |
| GitHub publishing norms | PASS | MIT, README/CHANGELOG, Releases-only binaries |
| Post-design re-check | PASS | Contracts and structure remain within gates; no unjustified complexity |

## Project Structure

### Documentation (this feature)

```text
specs/001-audio-default-product/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── preload-api.md
└── tasks.md                 # created by /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
src/                         # React UI (ESM)
├── App.jsx
├── main.jsx
└── styles (existing CSS)

electron/                    # Application shell + media pipeline (CJS)
├── main.cjs                 # BrowserWindow, IPC handlers
├── preload.cjs              # contextBridge `trackdefault`
└── media/
    ├── index.cjs            # public scanFolder / applyTrack exports
    ├── tools.cjs            # resolve bundled ffprobe/mkvpropedit
    ├── tracks.cjs           # normalize + language+title identity
    ├── scan.cjs             # folder walk + ffprobe
    └── apply.cjs            # mkvpropedit default flags + journal

resources/
└── bin/                     # populated by fetch script (gitignored binaries)
    ├── win32-x64/
    └── darwin-{arm64,x64}/

scripts/
├── fetch-media-binaries.mjs # download/verify platform helpers into resources/bin
├── pack-win.mjs / pack-mac  # or npm scripts wrapping electron-builder
└── dev-electron.cjs

release/                     # local build output only (gitignored)
docs at root:
├── README.md                # SEO + downloads + macOS first-open
├── CHANGELOG.md             # single initial entry
└── LICENSE                  # MIT
```

**Structure Decision**: Keep a single Electron+Vite app at repo root (no monorepo). Modularize the current monolithic `electron/media.cjs` into `electron/media/*` and isolate helper resolution + track identity. Vendor binaries under `resources/bin` via fetch-at-build, packaged with electron-builder `extraResources`.

## Complexity Tracking

> No constitution violations requiring justification.
