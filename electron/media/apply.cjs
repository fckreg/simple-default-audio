const path = require('path')
const { execFileSync } = require('child_process')
const { exists, requireTools } = require('./tools.cjs')
const { getScanCache } = require('./scan.cjs')
const { runProcess } = require('./process.cjs')
const { t, normalizeLocale } = require('../i18n/messages.cjs')

function isReadOnlyWin(file) {
  try {
    const attrs = execFileSync('attrib', [file], { encoding: 'utf8', windowsHide: true })
    const flags = attrs.replace(file, '').trim()
    return /(^|\s)R(\s|$)/i.test(flags)
  } catch {
    return false
  }
}

function setReadOnlyWin(file, on) {
  execFileSync('attrib', [on ? '+R' : '-R', file], { windowsHide: true })
}

async function setDefaultAudioTrack(mkvpropedit, file, targetOrdinal, allOrdinals) {
  const args = [file]
  for (const n of allOrdinals) {
    args.push('--edit', `track:a${n}`, '--set', `flag-default=${n === targetOrdinal ? '1' : '0'}`)
  }

  const hadReadOnly = process.platform === 'win32' && isReadOnlyWin(file)
  if (hadReadOnly) setReadOnlyWin(file, false)
  try {
    await runProcess(mkvpropedit, args)
  } finally {
    if (hadReadOnly) setReadOnlyWin(file, true)
  }
}

function trackDisplayName(option) {
  return option.title?.trim() || option.label
}

/**
 * Metadata-only default via mkvpropedit. Skips files missing TrackIdentity.key.
 */
async function applyTrack(folder, trackId, options = {}) {
  const locale = normalizeLocale(options.locale)
  const log = typeof options.onLog === 'function' ? options.onLog : () => {}
  const warnLine = (line) => {
    console.warn(line)
    log(line)
  }

  if (!folder || !exists(folder)) {
    throw new Error(t(locale, 'folderMissing'))
  }
  if (!trackId) {
    throw new Error(t(locale, 'trackMissing'))
  }

  const resolved = path.resolve(folder)
  const scanCache = getScanCache()
  if (!scanCache || scanCache.folder !== resolved) {
    throw new Error(t(locale, 'scanStale'))
  }

  const option = scanCache.options.find((item) => item.id === trackId)
  if (!option) {
    throw new Error(t(locale, 'trackNotFound'))
  }

  const tools = requireTools(locale)
  const { mkvpropedit } = tools
  const trackName = trackDisplayName(option)

  log(`mkvpropedit: ${mkvpropedit}${tools.mkvpropeditBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(t(locale, 'folder', resolved))
  log(t(locale, 'trackLine', option.label))
  log('')

  let ok = 0
  let warn = 0
  let fail = 0

  for (const entry of scanCache.entries) {
    const { file, name, tracks, error } = entry
    if (error) {
      const line = t(locale, 'fail', name, error)
      console.error(line)
      log(line)
      fail++
      continue
    }

    const matches = tracks.filter((tr) => tr.key === option.key)
    if (matches.length === 0) {
      warnLine(t(locale, 'warnMissing', name, trackName))
      if (tracks.length === 0) {
        log(t(locale, 'noAudioListed'))
      }
      for (const tr of tracks) {
        const mark = tr.isDefault ? '*' : ' '
        const title = tr.title.trim() || t(locale, 'untitled')
        log(`         ${mark} a${tr.audioOrdinal}: [${tr.language || '—'}] ${title}`)
      }
      warn++
      continue
    }

    const target = matches[0]
    if (matches.length > 1) {
      warnLine(t(locale, 'warnMulti', name, trackName, target.audioOrdinal))
    }

    const quoted = target.title.trim() || trackName
    const defaults = tracks.filter((tr) => tr.isDefault)
    if (target.isDefault && defaults.length === 1) {
      log(t(locale, 'alreadyDefault', name, target.audioOrdinal, quoted))
      ok++
      continue
    }

    try {
      await setDefaultAudioTrack(
        mkvpropedit,
        file,
        target.audioOrdinal,
        tracks.map((tr) => tr.audioOrdinal),
      )
      log(t(locale, 'done', name, target.audioOrdinal, quoted))
      ok++
    } catch (err) {
      const line = t(locale, 'fail', name, err.message || err)
      console.error(line)
      log(line)
      fail++
    }
  }

  log('')
  log(t(locale, 'summary', ok, warn, fail, scanCache.entries.length))
  return { ok, warn, fail, total: scanCache.entries.length }
}

module.exports = {
  applyTrack,
  setDefaultAudioTrack,
}
