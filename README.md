# TrackDefault

**Lightweight desktop utility** that sets the **default audio track** on MKV files — metadata only, no remux, no re-encode.

Pick a folder → choose a track by **language + title** → apply. Matching files update in place; files without that identity are skipped with a journal warning.

| | |
|---|---|
| Platforms | Windows 10/11 (x64 portable), macOS 12+ (zip/dmg) |
| License | [MIT](./LICENSE) |
| Downloads | **[GitHub Releases](https://github.com/fckreg/simple-default-audio/releases)** only |

## Download

1. Open **[Releases](https://github.com/fckreg/simple-default-audio/releases)**
2. Get the asset for your OS:
   - Windows: `TrackDefault.exe` (portable)
   - macOS: `TrackDefault-mac-*.zip` or `.dmg`

Binaries are **not** committed to this repository. Always use Releases.

## macOS first open (unsigned builds)

v1 macOS builds are **unsigned / ad-hoc** (no Apple Developer notarization).

1. Download and unpack the zip (or open the DMG).
2. Move **TrackDefault** to Applications (recommended).
3. First launch: right-click the app → **Open** → confirm **Open** in the Gatekeeper dialog.  
   Or: System Settings → Privacy & Security → allow the blocked app, then open again.
4. If macOS still blocks the app: remove the quarantine flag in Terminal:

```bash
xattr -dr com.apple.quarantine /Applications/TrackDefault.app
```

## What it does

- Scans `.mkv` files (optional subfolders)
- Lists distinct audio options by **normalized language + title**
- Sets `flag-default` via bundled `mkvpropedit` (headers only)
- Streams a readable journal; continues after per-file skips/errors
- Ships with bundled `ffprobe` + `mkvpropedit` so you do not need system installs

## Develop

```bash
npm install
npm run fetch-binaries   # populates resources/bin/<platform-arch>/
npm run dev
```

### Package

```bash
npm run pack:win   # Windows portable (run on Windows)
npm run pack:mac   # macOS zip/dmg (run on macOS)
```

Output goes to `release/` (gitignored). Attach artifacts to a GitHub Release — do not commit them.

### Helper binaries

`npm run fetch-binaries` downloads verified helpers into `resources/bin/`:

| Target | Notes |
|--------|--------|
| `win32-x64` | FFmpeg GPL build + MKVToolNix portable |
| `darwin-arm64` / `darwin-x64` | ffprobe (evermeet) + local mkvpropedit seed |

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for license attribution.

## Contributing

Issues and PRs welcome. Keep the product focused: folder → track → default audio on MKV. Prefer metadata-only changes and the modular `electron/media/*` layout.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
