const fs = require('fs')
const path = require('path')
const { exists, requireTools } = require('./tools.cjs')
const { trackKey, buildOptions, publicOption } = require('./tracks.cjs')
const { runProcess } = require('./process.cjs')

/** @type {null | { folder: string, recurse: boolean, entries: object[], options: object[], total: number }} */
let scanCache = null

function getScanCache() {
  return scanCache
}

function clearScanCache() {
  scanCache = null
}

function listMkvFiles(folder, recurse) {
  const results = []
  function walk(dir) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (recurse) walk(full)
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.mkv')) {
        results.push(full)
      }
    }
  }
  walk(folder)
  results.sort((a, b) => a.localeCompare(b, 'ru'))
  return results
}

async function getAudioTracks(ffprobe, file) {
  const { stdout } = await runProcess(ffprobe, [
    '-v', 'error',
    '-select_streams', 'a',
    '-show_entries', 'stream=index,codec_name,channels:stream_disposition=default:stream_tags=language,title',
    '-of', 'json',
    '--', file,
  ])

  const data = JSON.parse(stdout || '{}')
  const streams = Array.isArray(data.streams) ? data.streams : []
  return streams.map((s, i) => {
    const title = s.tags?.title ? String(s.tags.title) : ''
    const language = s.tags?.language ? String(s.tags.language) : ''
    const track = {
      streamIndex: Number(s.index),
      audioOrdinal: i + 1,
      codec: String(s.codec_name || ''),
      channels: Number(s.channels || 0),
      language,
      title,
      isDefault: Number(s.disposition?.default) === 1,
    }
    track.key = trackKey(track)
    return track
  })
}

/**
 * FolderSelection → ScanCache via ffprobe headers only.
 * @param {string} folder
 * @param {{ recurse?: boolean, onLog?: (line: string) => void, isCancelled?: () => boolean }} [options]
 */
async function scanFolder(folder, options = {}) {
  const recurse = Boolean(options.recurse)
  const log = typeof options.onLog === 'function' ? options.onLog : () => {}
  const isCancelled = typeof options.isCancelled === 'function' ? options.isCancelled : () => false

  if (!folder || !exists(folder)) {
    throw new Error('Папка не найдена')
  }

  const resolved = path.resolve(folder)
  const tools = requireTools()
  const { ffprobe, mkvpropedit } = tools

  if (!isCancelled()) scanCache = null

  log(`ffprobe: ${ffprobe}${tools.ffprobeBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(`mkvpropedit: ${mkvpropedit}${tools.mkvpropeditBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(`Папка: ${resolved}`)
  log(recurse ? 'Режим: с подпапками' : 'Режим: только эта папка')
  log('')

  const files = listMkvFiles(resolved, recurse)
  if (isCancelled()) return { cancelled: true }

  if (files.length === 0) {
    scanCache = { folder: resolved, recurse, entries: [], options: [], total: 0 }
    log('MKV-файлы не найдены')
    return { options: [], total: 0, failed: 0, withAudio: 0 }
  }

  log(`MKV-файлов: ${files.length}`)

  const entries = []
  let failed = 0
  let withAudio = 0

  for (const file of files) {
    if (isCancelled()) return { cancelled: true }
    const name = path.basename(file)
    try {
      const tracks = await getAudioTracks(ffprobe, file)
      if (isCancelled()) return { cancelled: true }
      entries.push({ file, name, tracks })
      if (tracks.length === 0) {
        log(`[SCAN] ${name} — нет аудиодорожек`)
      } else {
        withAudio++
        const brief = tracks.map((t) => {
          const title = t.title.trim() || t.language || t.codec || 'аудио'
          return `a${t.audioOrdinal} [${t.language || '—'}] ${title}`
        }).join(', ')
        log(`[SCAN] ${name} — ${brief}`)
      }
    } catch (err) {
      if (isCancelled()) return { cancelled: true }
      failed++
      const message = err.message || String(err)
      entries.push({ file, name, tracks: [], error: message })
      log(`[FAIL] ${name} — ${message}`)
    }
  }

  if (isCancelled()) return { cancelled: true }

  const optionsList = buildOptions(entries, files.length)
  scanCache = {
    folder: resolved,
    recurse,
    entries,
    options: optionsList,
    total: files.length,
  }

  log('')
  if (optionsList.length === 0) {
    log('Аудиодорожки не найдены')
  } else {
    log(`Найдено разных дорожек (язык+название): ${optionsList.length}`)
    for (const opt of optionsList) log(`  ${opt.text}`)
  }

  return {
    options: optionsList.map(publicOption),
    total: files.length,
    failed,
    withAudio,
  }
}

module.exports = {
  listMkvFiles,
  getAudioTracks,
  scanFolder,
  getScanCache,
  clearScanCache,
}
