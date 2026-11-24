# Changelog

All notable changes to TrackDefault are documented in this file.

## [1.0.0] — 2026-11-24

### Added

- First public release of **TrackDefault**: set the default MKV audio track by language + title without remuxing.
- Windows portable build (`TrackDefault.exe`) with bundled `ffprobe` and `mkvpropedit`.
- macOS zip/dmg packaging (unsigned / ad-hoc) with Gatekeeper first-open steps documented in the README.
- Optional subfolder scan, live journal, and busy-lock against overlapping jobs.
- MIT license and third-party notices for bundled helpers.
