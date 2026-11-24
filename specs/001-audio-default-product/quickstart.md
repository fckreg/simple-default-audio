# Quickstart Validation: TrackDefault

Prove the feature end-to-end after implement. Details: [data-model.md](./data-model.md), [contracts/preload-api.md](./contracts/preload-api.md).

## Prerequisites

- Node.js 20+ and npm
- Sample folder with ≥5 MKV files, multiple audio tracks; at least two files sharing the same language+title; at least one file missing that pair (for skip warning)
- For packaged test: machine **without** system ffprobe/mkvpropedit on PATH (or temporarily rename them)

## Dev setup

```bash
npm install
node scripts/fetch-media-binaries.mjs   # after script exists — populates resources/bin for host OS
npm run dev
```

Expected: window titled TrackDefault (or Russian UI with TrackDefault product identity), no legacy brand strings.

## Scenario A — Core happy path (P1)

1. Choose sample folder (recurse off).
2. Confirm selector lists **one row per language+title** (not per track number).
3. Choose a shared identity; Apply.
4. Journal shows per-file ok/skip; files with matching identity updated; missing identity warned.
5. Open an updated MKV in a normal player — chosen track is default.
6. Confirm file size barely changed (metadata-only).

## Scenario B — Bundled helpers (P1 / SC-002)

1. Build packaged artifact for current OS (`npm run pack` / mac equivalent).
2. Run on a clean PATH (no system media tools).
3. Repeat Scenario A — must succeed using only bundled binaries.

## Scenario C — Subfolders + busy lock (P3)

1. Enable include subfolders; scan nested tree.
2. During apply, UI controls for starting another job stay disabled; journal scrolls.

## Scenario D — Public presence (P2)

1. Repo `fckreg/simple-default-audio`: MIT LICENSE, README (lightweight + Releases links + macOS first-open), CHANGELOG with one entry.
2. GitHub Release has Windows + macOS assets; README reaches them in ≤2 clicks.
3. Repo-wide search: no legacy brand identifiers outside constitution ban wording.

## Done when

- Scenarios A–D pass on Windows; A–C (and B if Mac build available) on macOS
- Constitution gates still satisfied (metadata-only, security boundary, bundled tools)
