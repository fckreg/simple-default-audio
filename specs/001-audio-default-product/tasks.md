# Tasks: TrackDefault Product Release

**Input**: Design documents from `/specs/001-audio-default-product/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec — no TDD/test-framework tasks. Validation via `quickstart.md` manual scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Electron+Vite project at repo root: `src/`, `electron/`, `scripts/`, `resources/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align repo layout and ignore rules with the implementation plan

- [X] T001 Create directories `electron/media/`, `resources/bin/`, and `scripts/` placeholders per `plan.md` structure
- [X] T002 [P] Update `.gitignore` to ignore `resources/bin/**` binaries, `release/`, and leftover `release-build/` while keeping source tree publishable
- [X] T003 [P] Add npm script stubs in `package.json` for `fetch-binaries`, `pack:win`, and `pack:mac` (wire implementations in later phases)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modular media core, bundled-tool resolution, and IPC contract — MUST complete before story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement helper resolution in `electron/media/tools.cjs` (prefer `process.resourcesPath` / `resources/bin`, PATH only as dev fallback; fail early with clear errors)
- [X] T005 [P] Implement track identity helpers in `electron/media/tracks.cjs` citing `data-model.md` `TrackIdentity.languageNorm`, `TrackIdentity.titleNorm`, and `TrackIdentity.key` (language+title; not title-only)
- [X] T006 [P] Add `scripts/fetch-media-binaries.mjs` to download/verify ffprobe + mkvpropedit into `resources/bin/<platform-arch>/` for the host (and document target arches)
- [X] T007 Split monolithic `electron/media.cjs` into `electron/media/scan.cjs`, `electron/media/apply.cjs`, and facade `electron/media/index.cjs`; delete or re-export from old path so `electron/main.cjs` requires the facade
- [X] T008 Align `electron/preload.cjs` and `electron/main.cjs` with `contracts/preload-api.md` (`window.trackdefault`, `select-folder` / `scan-folder` / `apply-track` / `process-log`)
- [X] T009 Ensure `electron/main.cjs` window title and security flags (`contextIsolation`, `sandbox`, no `nodeIntegration`) match TrackDefault constitution constraints

**Checkpoint**: Foundation ready — modular media + tool resolve + IPC contract in place

---

## Phase 3: User Story 1 - Set default audio for a folder (Priority: P1) 🎯 MVP

**Goal**: Download-and-run capable core: pick folder, list tracks by language+title, apply metadata-only default with journal; Windows portable includes bundled helpers

**Independent Test**: On a clean PATH, open shipped/dev build, select a multi-track MKV folder, choose a language+title option, apply; matching files update without remux; missing identity files warn; journal shows outcomes (quickstart Scenarios A–B)

### Implementation for User Story 1

- [X] T010 [US1] Implement folder listing + ffprobe scan in `electron/media/scan.cjs` citing `data-model.md` `FolderSelection.path`, `FolderSelection.recurse`, `FileEntry.file`, `FileEntry.tracks`, `AudioStream.*`, and `ScanCache` lifecycle
- [X] T011 [US1] Build selector options in `electron/media/tracks.cjs` / scan pipeline citing `data-model.md` `AudioTrackOption.id`, `AudioTrackOption.key`, `AudioTrackOption.label`/`text`, and `AudioTrackOption.fileCount`
- [X] T012 [US1] Implement metadata-only apply in `electron/media/apply.cjs` citing `data-model.md` `BatchJobResult.ok`/`warn`/`fail`/`total` and per-file skip when `TrackIdentity.key` missing; stream journal lines
- [X] T013 [US1] Wire UI folder → track select → apply → journal in `src/App.jsx` to `window.trackdefault` per `contracts/preload-api.md`; Russian copy; TrackDefault branding
- [X] T014 [P] [US1] Refresh lightweight single-composition styles in `src` CSS (folder → track → apply → journal; no dashboard clutter)
- [X] T015 [US1] Configure electron-builder in `package.json` for Windows portable `TrackDefault.exe` with `extraResources` from `resources/bin/win32-x64/`
- [X] T016 [US1] Implement `scripts`/`npm run pack:win` flow that fetches Win binaries then builds; verify scan/apply works without system ffprobe/mkvpropedit

**Checkpoint**: User Story 1 fully functional and testable as MVP on Windows

---

## Phase 4: User Story 2 - Discover, download, and trust the product (Priority: P2)

**Goal**: Public GitHub presence for `fckreg/simple-default-audio` with MIT, SEO README, CHANGELOG, Releases-only downloads, macOS first-open docs

**Independent Test**: Cold visitor understands lightweight purpose from README in &lt;30s; finds Win+mac download path via Releases within two clicks; LICENSE is MIT; one CHANGELOG entry (quickstart Scenario D)

### Implementation for User Story 2

- [X] T017 [P] [US2] Add root `LICENSE` (MIT) for TrackDefault / `fckreg`
- [X] T018 [P] [US2] Write SEO-oriented root `README.md` (TrackDefault lightweight positioning, English primary, Releases download links, contribution invite)
- [X] T019 [P] [US2] Add root `CHANGELOG.md` with a single initial release entry for v1.0.0
- [X] T020 [P] [US2] Add `THIRD_PARTY_NOTICES` (or README section) for bundled ffprobe/mkvpropedit license attribution
- [X] T021 [US2] Document unsigned macOS Gatekeeper / first-open steps in `README.md` (clarification A)
- [X] T022 [US2] Create public GitHub repo `https://github.com/fckreg/simple-default-audio`, push cleaned source (no ship binaries in git), set description/topics for search
- [X] T023 [US2] Publish GitHub Release assets workflow notes in `README.md` (Windows + macOS artifacts as Release assets only; do not commit `release/` binaries)

**Checkpoint**: User Stories 1 and 2 independently demonstrable (app + public presence)

---

## Phase 5: User Story 3 - Optional subfolders and readable progress (Priority: P3)

**Goal**: Recurse into subfolders; live journal; busy-lock so overlapping jobs cannot start

**Independent Test**: Nested MKVs appear when recurse on; during apply UI blocks a second job; journal scrolls with progress (quickstart Scenario C)

### Implementation for User Story 3

- [X] T024 [US3] Ensure recurse flag end-to-end citing `data-model.md` `FolderSelection.recurse` in `electron/media/scan.cjs`, `electron/media/apply.cjs`, `electron/main.cjs` IPC, and `src/App.jsx` checkbox
- [X] T025 [US3] Harden busy-state / scan-generation lock in `electron/main.cjs` and disable overlapping actions in `src/App.jsx` citing `data-model.md` BatchJob `idle`→`scanning`|`applying`→`idle` transitions
- [X] T026 [US3] Verify streamed `process-log` journal auto-scroll and human-readable per-file lines in `src/App.jsx` during long batches

**Checkpoint**: All three user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: macOS pack, cleanup, compliance, validation

- [X] T027 [P] Configure macOS electron-builder target (zip/dmg) in `package.json` with `extraResources` from `resources/bin/darwin-*` and `npm run pack:mac`
- [X] T028 [P] Add macOS unsigned/ad-hoc packaging notes and artifact naming under TrackDefault in `package.json` / `README.md`
- [X] T029 Remove obsolete clutter (`electron/media.cjs` if fully replaced, empty legacy folders) and confirm modular paths match `plan.md`
- [X] T030 Repo-wide search confirming zero legacy brand identifiers outside constitution ban wording
- [X] T031 Run full validation from `specs/001-audio-default-product/quickstart.md` Scenarios A–D and fix gaps
- [X] T032 Attach built Windows + macOS artifacts to the GitHub Release for `fckreg/simple-default-audio` (not into git)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; can proceed after or parallel to US1 for docs/repo, but Release assets need US1/US polish builds
- **User Story 3 (Phase 5)**: Depends on Foundational; best after US1 UI/IPC exist
- **Polish (Phase 6)**: Depends on desired stories (mac pack + release attach after US1+US2)

### User Story Dependencies

- **US1 (P1)**: After Phase 2 only — no dependency on US2/US3
- **US2 (P2)**: Docs/repo independent; binary Release attach waits on pack tasks (T016/T027/T032)
- **US3 (P3)**: Builds on US1 UI/media paths but remains separately testable via recurse + busy lock

### Parallel Opportunities

- T002 || T003 after T001
- T005 || T006 while T004 in progress (different files)
- T014 || parts of packaging prep once UI stable
- T017 || T018 || T019 || T020 in US2
- T027 || T028 in Polish

---

## Parallel Example: User Story 1

```bash
# After foundational (T004–T009):
Task: "T010 scan.cjs FolderSelection/FileEntry/AudioStream/ScanCache"
Task: "T011 AudioTrackOption building via TrackIdentity.key"
# Then sequentially:
Task: "T012 apply.cjs BatchJobResult + metadata-only"
Task: "T013 App.jsx wire trackdefault API"
# Parallel with styling:
Task: "T014 [P] lightweight CSS"
Task: "T015–T016 Windows pack + bundled helpers"
```

## Parallel Example: User Story 2

```bash
Task: "T017 LICENSE"
Task: "T018 README SEO"
Task: "T019 CHANGELOG"
Task: "T020 THIRD_PARTY_NOTICES"
# Then:
Task: "T021–T023 macOS docs + create repo + Releases policy"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1 (including Win portable + bundled tools)  
4. **STOP and VALIDATE** quickstart A–B  
5. Demo locally before GitHub polish  

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. US1 → MVP desktop utility  
3. US2 → public discoverability + MIT repo  
4. US3 → recurse + busy/journal hardening  
5. Polish → macOS pack + Release assets + quickstart D  

### Parallel Team Strategy

1. Together: Phase 1–2  
2. Then: Dev A = US1 media/UI/pack; Dev B = US2 docs/repo; Dev C = US3 recurse/locks when UI exists  

---

## Notes

- [P] = different files, no incomplete-task dependency  
- Cite `data-model.md` fields instead of duplicating constraints  
- Track identity MUST be language+title (`TrackIdentity.key`), replacing any title-only logic  
- Do not commit ship binaries; GitHub Releases only  
- Suggested MVP scope: **Phases 1–3 (through T016)**  

