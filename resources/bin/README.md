# Bundled media helpers

Populate with `npm run fetch-binaries` (or `node scripts/fetch-media-binaries.mjs`).

| Directory | Contents |
|-----------|----------|
| `win32-x64/` | `ffprobe.exe`, `mkvpropedit.exe` |
| `darwin-arm64/` | `ffprobe`, `mkvpropedit` |
| `darwin-x64/` | `ffprobe`, `mkvpropedit` |

Binaries are **gitignored**. Packaged apps copy them via electron-builder `extraResources`. Ship only through GitHub Releases.
