# Contract: `window.simpleDefaultAudio` Preload API

Surface between sandboxed renderer and Electron main. All methods are async except `onLog` subscription.

## Global

```ts
window.simpleDefaultAudio: SimpleDefaultAudioApi
```

Must be the only media/filesystem bridge. No Node APIs in renderer.

## Methods

### `selectFolder(locale?: 'en' | 'ru'): Promise<string | null>`

Opens native directory dialog. Returns absolute path or `null` if cancelled.

### `scanFolder(folder: string, recurse: boolean, locale?: 'en' | 'ru'): Promise<ScanResult>`

Discovers `.mkv` files, probes audio headers, builds distinct options by **language+title** identity.

```ts
type ScanResult =
  | { ok: true; options: TrackOptionPublic[]; total: number; /* other summary fields allowed */ }
  | { ok: false; cancelled?: boolean; error?: string }
```

`TrackOptionPublic` MUST include at least: `id`, `text` (or `label`), and enough fields for UI. Identity MUST NOT be track index alone.

Emits `process-log` lines during work.

### `applyTrack(folder: string, recurse: boolean, trackId: string, locale?: 'en' | 'ru'): Promise<ApplyResult>`

Sets default audio for each eligible file matching the option’s language+title key via metadata edit only.

```ts
type ApplyResult =
  | { ok: true; summary: { ok: number; warn: number; fail: number; total: number } }
  | { ok: false; error?: string }
```

Partial success is normal: `ok: true` with nonzero `warn`/`fail` still valid if the batch completed.

### `onLog(callback: (line: string) => void): () => void`

Subscribe to journal lines. Returns unsubscribe function. Main sends channel `process-log`.

## IPC channel map (main)

| Renderer invoke / event | Main |
|-------------------------|------|
| invoke `select-folder` | dialog |
| invoke `scan-folder` `{ folder, recurse }` | media.scanFolder |
| invoke `apply-track` `{ folder, recurse, trackId }` | media.applyTrack |
| on `process-log` | push string lines |

## Invariants

1. Main validates paths and refuses overlapping scan sequences where applicable (scan generation token).
2. Busy UI SHOULD disable new jobs; main SHOULD still be safe if invoked twice.
3. Missing bundled tools → failed result + clear log error (no silent success).
4. Rename of bridge global or channels requires updating preload, main, and renderer in one change set.
