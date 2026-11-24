# Data Model: TrackDefault Product Release

In-session only — no durable database.

## FolderSelection

| Field | Type | Rules |
|-------|------|-------|
| path | string | Absolute folder path from OS dialog; required to scan/apply |
| recurse | boolean | Default `false`; when true, include nested directories |

**Validation**: Path must exist and be a directory. Empty / no-MKV → empty options + clear UI/journal state (not success-with-tracks).

## AudioStream (per file)

| Field | Type | Rules |
|-------|------|-------|
| streamIndex | number | Container stream index (ffprobe) |
| audioOrdinal | number | 1-based among audio streams (mkvpropedit target) |
| language | string | Raw tag; may be empty |
| title | string | Raw tag; may be empty |
| codec | string | Display/hint only |
| channels | number | Display/hint only |
| isDefault | boolean | Current disposition |

## TrackIdentity

| Field | Type | Rules |
|-------|------|-------|
| languageNorm | string | `trim` + lower + collapse spaces |
| titleNorm | string | same normalization |
| key | string | `languageNorm + '\u001f' + titleNorm` |

**Uniqueness**: One selector option per distinct `key` across the folder scope.  
**Apply**: For each file, find stream with same `key`; if missing → skip/warn.

## AudioTrackOption (selector row)

| Field | Type | Rules |
|-------|------|-------|
| id | string | Stable for current scan session (e.g. index string) |
| key | string | TrackIdentity.key |
| title | string | Representative display title |
| language | string | Single language or joined set for display |
| label / text | string | Human-readable row including file coverage count |
| fileCount | number | Files containing this identity |

## ScanCache (session)

| Field | Type | Rules |
|-------|------|-------|
| folder | string | Resolved path |
| recurse | boolean | Must match apply request |
| entries | FileEntry[] | Per-file streams |
| options | AudioTrackOption[] | Built from entries |
| total | number | MKV file count |

**Lifecycle**: Cleared/replaced on new successful scan; apply requires cache matching folder+recurse or must re-scan first.

## FileEntry

| Field | Type | Rules |
|-------|------|-------|
| file | string | Absolute `.mkv` path |
| tracks | AudioStream[] (+ key) | From ffprobe headers only |

## BatchJobResult

| Field | Type | Rules |
|-------|------|-------|
| ok | number | Files successfully updated |
| warn | number | Skipped (no matching track, etc.) |
| fail | number | Errors (permissions, tool failure) |
| total | number | Files attempted |
| logLines | string[] | Streamed to UI during run |

**State transitions (job)**: `idle` → `scanning` | `applying` → `idle`. Overlapping jobs forbidden (busy lock).

## DistributionArtifact (publish metadata)

| Field | Type | Rules |
|-------|------|-------|
| os | `win` \| `mac` | |
| name | string | e.g. TrackDefault.exe / TrackDefault-mac.zip |
| channel | GitHub Release asset | Not committed to git |

## Relationships

```text
FolderSelection --scan--> ScanCache
ScanCache 1--* FileEntry
FileEntry 1--* AudioStream
AudioStream --identity--> TrackIdentity
ScanCache 1--* AudioTrackOption (keyed by TrackIdentity)
AudioTrackOption + FolderSelection --apply--> BatchJobResult
```
