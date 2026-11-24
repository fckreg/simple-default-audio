# Third-Party Notices

TrackDefault ships platform builds that may include the following helper programs. Their licenses apply to those binaries; TrackDefault itself is MIT (see `LICENSE`).

## FFmpeg / ffprobe

- Project: [FFmpeg](https://ffmpeg.org/)
- Typical build source used by the fetch script: [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) (Windows GPL builds) and [evermeet.cx](https://evermeet.cx/ffmpeg/) (macOS)
- License: GPL / LGPL depending on build configuration. The Windows GPL zip used by `scripts/fetch-media-binaries.mjs` is a **GPL** build.
- You can obtain corresponding source from the FFmpeg project and the build recipe repositories above.

## MKVToolNix / mkvpropedit

- Project: [MKVToolNix](https://mkvtoolnix.download/)
- Component used: `mkvpropedit` (metadata editor; no remux pipeline in TrackDefault)
- License: GPL-2.0-or-later (see upstream)
- Windows portable archives are downloaded from [mkvtoolnix.download](https://mkvtoolnix.download/downloads.html); macOS copies may come from a local MKVToolNix.app / Homebrew install when packaging.

## Electron and npm dependencies

Runtime and build tooling (Electron, React, Vite, electron-builder, etc.) are governed by their respective licenses listed in `package-lock.json` / upstream package metadata.
