/**
 * Downloads ffprobe + mkvpropedit into resources/bin/<platform-arch>/.
 *
 * Supported targets:
 *   win32-x64, darwin-arm64, darwin-x64
 *
 * Usage:
 *   node scripts/fetch-media-binaries.mjs            # host platform
 *   node scripts/fetch-media-binaries.mjs --all       # all known targets (CI)
 *   node scripts/fetch-media-binaries.mjs win32-x64
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
  chmodSync,
  copyFileSync,
  readdirSync,
  statSync,
  readFileSync,
} from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'
import { createHash } from 'crypto'
import { execFileSync, spawnSync } from 'child_process'
import { tmpdir } from 'os'
import { Readable } from 'stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BIN_ROOT = join(ROOT, 'resources', 'bin')

const MKVTOOLNIX_VERSION = '90.0'
// Essentials build keeps ffprobe much smaller than full BtbN gpl static (~160MB+).
const FFMPEG_WIN_URL = 'https://github.com/GyanD/codexffmpeg/releases/download/7.1.1/ffmpeg-7.1.1-essentials_build.zip'
const FFMPEG_MAC_URL = 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip'
const SEVEN_ZR_URL = 'https://www.7-zip.org/a/7zr.exe'

const TARGETS = {
  'win32-x64': { platform: 'win32', arch: 'x64' },
  'darwin-arm64': { platform: 'darwin', arch: 'arm64' },
  'darwin-x64': { platform: 'darwin', arch: 'x64' },
}

function hostTarget() {
  const platform = process.platform
  const arch = process.arch === 'ia32' ? 'x86' : process.arch
  return `${platform}-${arch}`
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

function fileSha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

async function download(url, dest) {
  console.log(`  ↓ ${url}`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  ensureDir(dirname(dest))
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
  return dest
}

function findFileRecursive(root, name) {
  const entries = readdirSync(root, { withFileTypes: true })
  for (const ent of entries) {
    const full = join(root, ent.name)
    if (ent.isFile() && ent.name === name) return full
    if (ent.isDirectory()) {
      const found = findFileRecursive(full, name)
      if (found) return found
    }
  }
  return null
}

function expandZip(zipPath, destDir) {
  ensureDir(destDir)
  if (process.platform === 'win32') {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: 'inherit' },
    )
  } else {
    execFileSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'inherit' })
  }
}

function expand7z(sevenZr, archive, destDir) {
  ensureDir(destDir)
  execFileSync(sevenZr, ['x', archive, `-o${destDir}`, '-y'], { stdio: 'inherit' })
}

async function fetchWin64(outDir) {
  const work = join(tmpdir(), `sda-bin-win-${Date.now()}`)
  ensureDir(work)
  try {
    const ffmpegZip = join(work, 'ffmpeg.zip')
    await download(FFMPEG_WIN_URL, ffmpegZip)
    console.log(`  sha256 ffmpeg.zip = ${fileSha256(ffmpegZip)}`)
    const ffmpegExtract = join(work, 'ffmpeg')
    expandZip(ffmpegZip, ffmpegExtract)
    const ffprobe = findFileRecursive(ffmpegExtract, 'ffprobe.exe')
    if (!ffprobe) throw new Error('ffprobe.exe не найден в архиве FFmpeg')

    const sevenZr = join(work, '7zr.exe')
    await download(SEVEN_ZR_URL, sevenZr)

    const mkvUrl = `https://mkvtoolnix.download/windows/releases/${MKVTOOLNIX_VERSION}/mkvtoolnix-64-bit-${MKVTOOLNIX_VERSION}.7z`
    const mkvArchive = join(work, 'mkvtoolnix.7z')
    await download(mkvUrl, mkvArchive)
    console.log(`  sha256 mkvtoolnix.7z = ${fileSha256(mkvArchive)}`)
    const mkvExtract = join(work, 'mkv')
    expand7z(sevenZr, mkvArchive, mkvExtract)
    const mkvpropedit = findFileRecursive(mkvExtract, 'mkvpropedit.exe')
    if (!mkvpropedit) throw new Error('mkvpropedit.exe не найден в архиве MKVToolNix')

    ensureDir(outDir)
    copyFileSync(ffprobe, join(outDir, 'ffprobe.exe'))
    copyFileSync(mkvpropedit, join(outDir, 'mkvpropedit.exe'))
    console.log(`  ✓ win32-x64 → ${outDir}`)
  } finally {
    try { rmSync(work, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

async function fetchDarwin(arch, outDir) {
  const work = join(tmpdir(), `sda-bin-mac-${arch}-${Date.now()}`)
  ensureDir(work)
  try {
    if (process.platform !== 'darwin') {
      console.warn(`  ! darwin-${arch}: полное скачивание с этой ОС ограничено.`)
      console.warn('    На macOS выполните: node scripts/fetch-media-binaries.mjs')
      console.warn('    Либо положите ffprobe и mkvpropedit вручную в', outDir)
      ensureDir(outDir)
      return
    }

    if ((arch === 'arm64' && process.arch !== 'arm64') || (arch === 'x64' && process.arch !== 'x64')) {
      console.warn(`  ! Пропуск darwin-${arch}: хост arch=${process.arch}. Положите бинарники вручную.`)
      ensureDir(outDir)
      return
    }

    const ffZip = join(work, 'ffprobe.zip')
    await download(FFMPEG_MAC_URL, ffZip)
    console.log(`  sha256 ffprobe.zip = ${fileSha256(ffZip)}`)
    const ffExtract = join(work, 'ff')
    expandZip(ffZip, ffExtract)
    const ffprobe = findFileRecursive(ffExtract, 'ffprobe')
    if (!ffprobe || !existsSync(ffprobe)) throw new Error('ffprobe не найден в архиве evermeet')

    const candidates = [
      '/Applications/MKVToolNix.app/Contents/MacOS/mkvpropedit',
      '/opt/homebrew/bin/mkvpropedit',
      '/usr/local/bin/mkvpropedit',
    ]
    let mkv = candidates.find((p) => existsSync(p))
    if (!mkv) {
      const which = spawnSync('which', ['mkvpropedit'], { encoding: 'utf8' })
      if (which.status === 0) mkv = which.stdout.trim()
    }
    if (!mkv) {
      throw new Error(
        'mkvpropedit не найден. Установите MKVToolNix (brew install mkvtoolnix) и повторите fetch.',
      )
    }

    ensureDir(outDir)
    copyFileSync(ffprobe, join(outDir, 'ffprobe'))
    copyFileSync(mkv, join(outDir, 'mkvpropedit'))
    chmodSync(join(outDir, 'ffprobe'), 0o755)
    chmodSync(join(outDir, 'mkvpropedit'), 0o755)
    console.log(`  ✓ darwin-${arch} → ${outDir}`)
  } finally {
    try { rmSync(work, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

async function fetchTarget(target) {
  const meta = TARGETS[target]
  if (!meta) {
    throw new Error(`Неизвестная цель «${target}». Известные: ${Object.keys(TARGETS).join(', ')}`)
  }
  const outDir = join(BIN_ROOT, target)
  console.log(`\n== ${target} ==`)
  if (meta.platform === 'win32') await fetchWin64(outDir)
  else await fetchDarwin(meta.arch, outDir)

  const names = meta.platform === 'win32'
    ? ['ffprobe.exe', 'mkvpropedit.exe']
    : ['ffprobe', 'mkvpropedit']
  for (const name of names) {
    const p = join(outDir, name)
    if (existsSync(p)) {
      const st = statSync(p)
      console.log(`  ${name}: ${(st.size / 1024 / 1024).toFixed(1)} MiB  sha256=${fileSha256(p)}`)
    } else {
      console.warn(`  (ожидается ${name} — пока отсутствует)`)
    }
  }
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  let targets
  if (args.includes('--all')) {
    targets = Object.keys(TARGETS)
  } else if (args.length) {
    targets = args
  } else {
    const host = hostTarget()
    if (!TARGETS[host]) {
      console.error(`Хост ${host} не в списке целей. Укажите цель явно или используйте --all.`)
      process.exit(1)
    }
    targets = [host]
  }

  console.log('SimpleDefaultAudio — fetch media binaries')
  console.log(`Root: ${BIN_ROOT}`)
  ensureDir(BIN_ROOT)

  for (const t of targets) {
    await fetchTarget(t)
  }
  console.log('\nГотово.')
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
