# Feature Specification: TrackDefault Product Release

**Feature Branch**: `001-audio-default-product`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Нужно реализовать приложение простое, оно должно компилироваться в готовое приложения для компьютеров мак и pc. Приложение представляет из себя просто окно с выбором папки с файлами, после выбора в селекте доступных звуковых дорожек появляется список. После выбора дорожки в указанной папке у видеофайлов меняется дефолтная звуковая дорожка. Приложению нужно придумать название. Дизайн. Архитектуру, разложить на модули правильно все. Сейчас это просто несколько файлов. Программа для изменения дорожки должна поставляться сразу… билд достаточно выкачать. Описание легковесное, SEO для поиска, люди качают, разработчики предлагают улучшения. GitHub https://github.com/fckreg — создать репо, подготовить проект, убрать лишнее, правильные папки (в т.ч. билда), стандарты публикации, changelog с одной записью."

## Clarifications

### Session 2026-11-24

- Q: How should TrackDefault decide that an audio track in one file is the same selectable option as a track in another file? → A: Match by normalized language + title (track number ignored)
- Q: Which open-source license should the public GitHub repository use for TrackDefault? → A: MIT
- Q: Where should users download the Windows and macOS builds of TrackDefault? → A: GitHub Releases only (binaries attached to release tags)
- Q: What should the GitHub repository name be under fckreg? → A: simple-default-audio (`https://github.com/fckreg/simple-default-audio`)
- Q: For the first public macOS build, how should code signing / Gatekeeper trust be handled? → A: Unsigned / ad-hoc v1 + clear README first-open steps

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set default audio for a folder (Priority: P1)

A person downloads the ready-made app for their computer (Windows or macOS), opens it, chooses a folder with video files, picks an audio track from the list of tracks found in those files, and applies it so that track becomes the default playback audio for the videos in that folder. No separate media tools need to be installed beforehand.

**Why this priority**: This is the core value of the product; without it the app has no reason to exist.

**Independent Test**: On a clean machine without media utilities installed, open the shipped build, select a folder of MKV files with multiple audio tracks, choose one track, apply, then open a file in a normal player and confirm the chosen track is the default. Journal shows per-file results.

**Acceptance Scenarios**:

1. **Given** the user has a shipped build and a folder with MKV files whose audio tracks share the same language and title (even if track numbers differ), **When** they select the folder, **Then** the track selector lists one option per distinct normalized language+title pair.
2. **Given** a folder is selected and tracks are listed, **When** the user chooses a track and confirms apply, **Then** each eligible file that has a matching language+title track is updated so that track is the default, without re-encoding or rewriting the whole media stream.
3. **Given** a file in the batch lacks the chosen track, **When** apply runs, **Then** that file is skipped with a clear journal warning and other files still complete.
4. **Given** a clean computer without system-wide media utilities, **When** the user runs only the downloaded build, **Then** scan and apply still work because required media helpers ship inside the product.

---

### User Story 2 - Discover, download, and trust the product (Priority: P2)

A new visitor finds the project on GitHub under the publisher account, understands in seconds that this is a lightweight free desktop utility for setting the default audio track, sees clear download links for Windows and macOS, and can open an issue or suggest an improvement.

**Why this priority**: Distribution and discoverability are explicit goals; downloads and contributions depend on public presentation.

**Independent Test**: Open the public repository page without prior knowledge; confirm name, short SEO-friendly description, lightweight positioning, changelog with at least one release note, and instructions or assets for obtaining Mac and PC builds.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the repository, **When** they read the title and short description, **Then** they can state what the app does and that it is lightweight without opening the source.
2. **Given** the repository is published, **When** a visitor looks for downloads, **Then** they find Windows and macOS build artifacts on the GitHub Releases page for the latest release, without hunting through the source tree.
3. **Given** a developer wants to help, **When** they browse the repo, **Then** they find contribution-friendly layout (readme, changelog, clear source layout) and can open an improvement suggestion.

---

### User Story 3 - Optional subfolders and readable progress (Priority: P3)

A user with videos nested in subfolders can include those folders in one run, and always sees a live journal of what is happening so long batches feel trustworthy.

**Why this priority**: Improves real-world batch use but the flat-folder flow already delivers MVP value.

**Independent Test**: Enable subfolder inclusion on a nested tree, run scan/apply, confirm nested files are processed and the journal scrolls with progress lines.

**Acceptance Scenarios**:

1. **Given** a selected folder with MKV files in subfolders, **When** the user enables “include subfolders” and scans, **Then** tracks from nested files appear in the selector.
2. **Given** a long apply is running, **When** the user watches the window, **Then** the journal updates with human-readable lines and the UI blocks starting a second overlapping job until the current one finishes.

---

### Edge Cases

- Empty folder or folder with no supported video files: show a clear empty state; do not pretend success.
- Files that are locked, read-only, or permission-denied: skip with journal error; continue the batch.
- Mixed track labels across files: selector shows the union of distinct normalized language+title identities; a file without a matching pair yields a warning skip (track numbers alone do not define identity).
- Very large folders (hundreds of files): UI remains responsive enough to show progress; user can see that work is ongoing.
- Missing or corrupted bundled media helper inside the build: fail early with an actionable message (do not silently claim success).
- macOS Gatekeeper / first-open trust prompts: v1 ships unsigned/ad-hoc; README MUST list the exact first-open steps (confirmed); Apple notarization is deferred.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Product MUST be named **TrackDefault** (working product name; short tagline: “Lightweight default audio track setter for video files”). Display name in the window and packaging MUST use this name unless amended before release.
- **FR-002**: Users MUST be able to select a folder of video files from a simple single-window desktop UI.
- **FR-003**: After folder selection, the UI MUST present a selectable list of distinct audio tracks discovered in the supported video files in that folder. Distinctness MUST be defined by normalized language + title; track index/number MUST NOT be the identity key.
- **FR-004**: After the user chooses a track and starts apply, the product MUST set the matching language+title audio track as the default for each eligible supported file in the selection scope without remuxing or re-encoding media. Files lacking that language+title pair MUST be skipped with a journal warning.
- **FR-005**: The product MUST ship ready-to-run builds for **Windows** and **macOS**. A user MUST be able to download the build for their OS and run the core workflow without installing separate media utilities on the system. The first public **macOS** build MAY be unsigned/ad-hoc; the README MUST document the exact Gatekeeper / first-open steps so a new user can open the app without guesswork.
- **FR-006**: Required media helper programs used for probing and for changing default-track metadata MUST be bundled with the distributed application (not “install separately if missing”).
- **FR-007**: Supported container for v1 MUST be **MKV** (metadata-only default-track change). Other containers are out of scope for this release.
- **FR-008**: The UI MUST show a running journal of scan/apply progress and per-file warnings or errors; batch apply MUST continue after individual file failures.
- **FR-009**: Users MUST be able to optionally include subfolders when scanning and applying.
- **FR-010**: Visual design MUST feel lightweight and purposeful: one primary composition (folder → track → apply → journal), clear hierarchy, no dashboard clutter; Russian UI copy MUST remain correct for Cyrillic.
- **FR-011**: Source layout MUST be modularized so that UI, application shell, media scan, media apply, shared tooling, and packaging/release concerns live in separate areas—not a handful of undifferentiated files.
- **FR-012**: Repository `https://github.com/fckreg/simple-default-audio` MUST host the project as a public app repository prepared for GitHub publishing norms: focused root readme, SEO-oriented short description and topics suitable for search, `CHANGELOG` with an initial single release entry, tidy source layout without committing ship binaries into git, removal of leftover/irrelevant clutter from the published tree, and an **MIT** `LICENSE` file. Windows and macOS builds MUST be published as **GitHub Release** assets only.
- **FR-013**: Public description MUST emphasize that TrackDefault is a **lightweight** utility, so search and social previews communicate “small, simple, download-and-use” positioning and invite improvements from developers.
- **FR-014**: Overlapping scan/apply jobs in one session MUST be prevented while a job is in progress.
- **FR-015**: Packaging identity (application id, executable/artifact names) and all project identifiers MUST use **TrackDefault** exclusively on user-facing surfaces, source, specs, and release artifacts.

### Key Entities

- **Folder Selection**: Path chosen by the user; optional recurse flag; scope of files to scan/apply.
- **Audio Track Option**: Distinct track identity shown in the selector, keyed by normalized language + title (codec/other cues may appear in the display label); maps to the per-file stream that shares that identity when applying default.
- **Batch Job**: A scan or apply run with progress lines and per-file outcomes (updated / skipped / failed).
- **Distribution Package**: OS-specific downloadable build (GitHub Release asset) that includes the UI app and bundled media helpers; macOS v1 may be unsigned/ad-hoc.
- **Public Project Presence**: Repository `fckreg/simple-default-audio` metadata, MIT license, readme, changelog entry, and Releases page for discovery and contributions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user on Windows or macOS completes “download → open → pick folder → choose track → apply” in under 5 minutes on a sample folder of at least 5 MKV files, without installing extra media tools.
- **SC-002**: On a machine without system-wide media utilities, scan and apply succeed for a valid sample folder using only the shipped build (100% of the core happy-path steps work offline after download).
- **SC-003**: For a batch of 20 mixed MKV files where 2 lack the chosen track, at least 18 files receive the new default and the journal lists the 2 skips explicitly.
- **SC-004**: Applying default audio does not increase file size by more than a negligible metadata delta (no full remux/re-encode); spot-check duration and picture/audio content remain unchanged.
- **SC-005**: A cold visitor can answer “what does this do?” and “is it heavy?” correctly from the repository title + short description alone in under 30 seconds.
- **SC-006**: Public repo includes exactly one initial changelog entry describing the first public release, and both OS builds are downloadable from the GitHub Releases page for that release within two clicks from the README.
- **SC-007**: A new contributor can identify where UI vs media scan/apply vs packaging live without asking, based on repository folder names alone (spot-check with a second person or checklist review).

## Assumptions

- Working product name is **TrackDefault**; publisher may rename before first public tag if desired, but planning proceeds under this name.
- v1 supports **MKV only**, aligning with lossless metadata-only default-track edits; “video files” in the request is interpreted as MKV for this release.
- Target desktops are **Windows** and **macOS** (Intel and Apple Silicon covered by the packaging plan); Linux is out of scope for v1.
- UI language remains **Russian** for the app window; repository marketing copy is primarily **English** (with optional Russian section) for GitHub search reach.
- Existing single-purpose workflow (folder → tracks → default) is preserved; no player, converter, or cloud features in this release.
- Constitution v2.1.0 already covers Win+macOS shipping, bundled media helpers, and zero-legacy-brand naming; implement follows that governance.
- GitHub repository is **`fckreg/simple-default-audio`** (confirmed); product display name remains **TrackDefault**.
- Ship binaries are distributed via **GitHub Releases** only; local `release/` (or equivalent) is a build output path and MUST NOT be the canonical download channel or a committed binary dump in git.
- Open-source license is **MIT** (confirmed); LICENSE ships with the public repository.

## Out of Scope

- Non-MKV containers (MP4/AVI/etc.) and any remux/re-encode pipelines.
- Linux packages, mobile apps, CLI-only product SKU.
- Apple Developer ID signing and notarization (follow-up after v1; v1 uses unsigned/ad-hoc macOS + README steps).
- Online accounts, telemetry dashboards, or in-app auto-update mandatory for v1.
- Implementing unrelated leftover experiments; they are removed or excluded from the published tree rather than maintained.
