# Research: TrackDefault Product Release

## 1. Bundling ffprobe + mkvpropedit

**Decision**: Vendor platform-specific binaries into `resources/bin/<platform-arch>/`, copy them into the packaged app via electron-builder `extraResources`, and resolve at runtime from `process.resourcesPath` first. PATH / common install paths remain **dev-only fallback**.

**Rationale**: Constitution III requires download-and-run without system tools. `ffprobe-static`-style npm packages are awkward for multi-platform Electron packaging and do not cover `mkvpropedit`. A fetch script per target OS/arch is the reliable approach used by similar Electron media apps.

**Alternatives considered**:
- PATH-only discovery — rejected (fails clean machines; violates constitution).
- npm `ffprobe-static` / `ffmpeg-static` only — incomplete (no mkvpropedit) and cross-packaging friction.
- Shipping full MKVToolNix GUI — rejected (heavy, not lightweight).

**License note**: Ship attribution/notices for FFmpeg/ffprobe and MKVToolNix/mkvpropedit in README or `THIRD_PARTY_NOTICES` as required by their licenses.

## 2. Track identity (language + title)

**Decision**: Canonical option key = `normalize(language) + '\u001f' + normalize(title)`. Empty language and/or title allowed; two streams match only when both normalized fields match. Display labels may still show codec/channels as hints but MUST NOT define identity. Track index/ordinal is used only when calling mkvpropedit for a specific file.

**Rationale**: Clarification session 2026-11-24 option A. Current code prefers title-only keys when title is present — that MUST be changed during implement to include language.

**Alternatives considered**:
- Title-only (current code) — rejected by clarification.
- Index-only — brittle across remuxed series.
- Exact raw label string — too fragile to whitespace/case.

## 3. Windows + macOS packaging

**Decision**:
- Windows: electron-builder **portable** `TrackDefault.exe` (x64).
- macOS: **zip** or **dmg** of unsigned/ad-hoc app; document Gatekeeper first-open in README. Prefer building mac artifacts on macOS CI (GitHub Actions `macos-latest`); Windows on `windows-latest`. Universal mac optional later; v1 may ship arm64 primary + x64 if feasible.

**Rationale**: Spec FR-005/clarification A for unsigned macOS; Releases-only distribution.

**Alternatives considered**:
- NSIS installer-only — portable matches “download and run”.
- Notarized mac first release — deferred (no Apple Developer requirement for v1).
- Commit binaries into git — rejected (clarification: GitHub Releases only).

## 4. Module split vs rewrite

**Decision**: Incremental modularization of existing Electron/React app — split `media.cjs`, keep working IPC surface `window.trackdefault`, refresh UI branding/design lightly without changing the core workflow.

**Rationale**: Smallest change that satisfies FR-011 and constitution modularity while preserving UX.

**Alternatives considered**: Full rewrite in Tauri/native — higher risk, not required by spec.

## 5. Public GitHub presence

**Decision**: Create/publish `https://github.com/fckreg/simple-default-audio` with MIT LICENSE, English SEO README (TrackDefault lightweight positioning + Releases download links + macOS steps), CHANGELOG with one v1.0.0 entry, topics suitable for search. Local `release/` gitignored.

**Rationale**: Clarifications B/A/A for license, Releases, repo slug.

**Alternatives considered**: Binaries in-repo `release/` — rejected.
