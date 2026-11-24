# Changelog

All notable changes to SimpleDefaultAudio are documented in this file.

## [1.0.1] — 2026-11-24

### Changed

- Product renamed to **SimpleDefaultAudio** across UI, packaging, and IPC.
- Three-step UI: folder → track → result; EN (default) / RU language switch.
- Scan only the selected folder (no subfolders).
- Smaller Windows helpers (FFmpeg essentials); app icon added.

## [1.0.0] — 2026-11-24

### Added

- First release: set the default MKV audio track by language + title without remuxing.
- Windows portable build with bundled `ffprobe` and `mkvpropedit`.
- macOS packaging path (unsigned / ad-hoc) documented in the README.
