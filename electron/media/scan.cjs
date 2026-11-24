const fs = require('fs')
const path = require('path')
const { exists, requireTools } = require('./tools.cjs')
const { trackKey, buildOptions, publicOption } = require('./tracks.cjs')
const { runProcess } = require('./process.cjs')
const { t, normalizeLocale } = require('../i18n/messages.cjs')

/** @type {null | { folder: string, entries: object[], options: object[], total: number }} */
let scanCache = null

function getScanCache() {
  return scanCache
}

function clearScanCache() {
  scanCache = null
}

/** Only files directly in the folder — no subfolders. */
function listMkvFiles(folder, locale = 'en') {
  const collator = normalizeLocale(locale) === 'ru' ? 'ru' : 'en'
  let entries
  try {
    entries = fs.readdirSync(folder, { withFileTypes: true })
  } catch {
    return []
  }
  const results = []
  for (const ent of entries) {
    if (ent.isFile() && ent.name.toLowerCase().endsWith('.mkv')) {
      results.push(path.join(folder, ent.name))
    }
  }
  results.sort((a, b) => a.localeCompare(b, collator))
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
 */
async function scanFolder(folder, options = {}) {
  const locale = normalizeLocale(options.locale)
  const log = typeof options.onLog === 'function' ? options.onLog : () => {}
  const isCancelled = typeof options.isCancelled === 'function' ? options.isCancelled : () => false

  if (!folder || !exists(folder)) {
    throw new Error(t(locale, 'folderMissing'))
  }

  const resolved = path.resolve(folder)
  const tools = requireTools(locale)
  const { ffprobe, mkvpropedit } = tools

  if (!isCancelled()) scanCache = null

  log(`ffprobe: ${ffprobe}${tools.ffprobeBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(`mkvpropedit: ${mkvpropedit}${tools.mkvpropeditBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(t(locale, 'folder', resolved))
  log('')

  const files = listMkvFiles(resolved, locale)
  if (isCancelled()) return { cancelled: true }

  if (files.length === 0) {
    scanCache = { folder: resolved, entries: [], options: [], total: 0 }
    log(t(locale, 'noMkv'))
    return { options: [], total: 0, failed: 0, withAudio: 0 }
  }

  log(t(locale, 'mkvCount', files.length))

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
        log(`[SCAN] ${name} — ${t(locale, 'noAudioInFile')}`)
      } else {
        withAudio++
        const brief = tracks.map((tr) => {
          const title = tr.title.trim() || tr.language || tr.codec || t(locale, 'audio')
          return `a${tr.audioOrdinal} [${tr.language || '—'}] ${title}`
        }).join(', ')
        log(`[SCAN] ${name} — ${brief}`)
      }
    } catch (err) {
      if (isCancelled()) return { cancelled: true }
      failed++
      const message = err.message || String(err)
      entries.push({ file, name, tracks: [], error: message })
      log(t(locale, 'fail', name, message))
    }
  }

  if (isCancelled()) return { cancelled: true }

  const optionsList = buildOptions(entries, files.length, locale)
  scanCache = {
    folder: resolved,
    entries,
    options: optionsList,
    total: files.length,
  }

  log('')
  if (optionsList.length === 0) {
    log(t(locale, 'noAudioOverall'))
  } else {
    log(t(locale, 'distinctTracks', optionsList.length))
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
