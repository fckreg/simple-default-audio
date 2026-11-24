const path = require('path')
const { execFileSync } = require('child_process')
const { exists, requireTools } = require('./tools.cjs')
const { getScanCache } = require('./scan.cjs')
const { runProcess } = require('./process.cjs')

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
 * @param {string} folder
 * @param {string} trackId
 * @param {{ recurse?: boolean, onLog?: (line: string) => void }} [options]
 * @returns {Promise<{ ok: number, warn: number, fail: number, total: number }>}
 */
async function applyTrack(folder, trackId, options = {}) {
  const recurse = Boolean(options.recurse)
  const log = typeof options.onLog === 'function' ? options.onLog : () => {}
  const warnLine = (line) => {
    console.warn(line)
    log(line)
  }

  if (!folder || !exists(folder)) {
    throw new Error('Папка не найдена')
  }
  if (!trackId) {
    throw new Error('Дорожка не выбрана')
  }

  const resolved = path.resolve(folder)
  const scanCache = getScanCache()
  if (!scanCache || scanCache.folder !== resolved || scanCache.recurse !== recurse) {
    throw new Error('Результаты сканирования устарели. Выберите папку ещё раз.')
  }

  const option = scanCache.options.find((item) => item.id === trackId)
  if (!option) {
    throw new Error('Выбранная дорожка не найдена. Просканируйте папку ещё раз.')
  }

  const tools = requireTools()
  const { mkvpropedit } = tools
  const trackName = trackDisplayName(option)

  log(`mkvpropedit: ${mkvpropedit}${tools.mkvpropeditBundled ? ' (bundled)' : ' (dev fallback)'}`)
  log(`Папка: ${resolved}`)
  log(`Дорожка: ${option.label}`)
  log('')

  let ok = 0
  let warn = 0
  let fail = 0

  for (const entry of scanCache.entries) {
    const { file, name, tracks, error } = entry
    if (error) {
      const line = `[FAIL] ${name} — ${error}`
      console.error(line)
      log(line)
      fail++
      continue
    }

    const matches = tracks.filter((t) => t.key === option.key)
    if (matches.length === 0) {
      warnLine(`[WARN] ${name} — дорожка «${trackName}» не найдена (нет пары язык+название)`)
      if (tracks.length === 0) {
        log('         аудиодорожек нет')
      }
      for (const t of tracks) {
        const mark = t.isDefault ? '*' : ' '
        const title = t.title.trim() || 'без названия'
        log(`         ${mark} a${t.audioOrdinal}: [${t.language || '—'}] ${title}`)
      }
      warn++
      continue
    }

    const target = matches[0]
    if (matches.length > 1) {
      warnLine(`[WARN] ${name} — несколько совпадений «${trackName}», берём a${target.audioOrdinal}`)
    }

    const quoted = target.title.trim() || trackName
    const defaults = tracks.filter((t) => t.isDefault)
    if (target.isDefault && defaults.length === 1) {
      log(`[OK]   ${name} — уже default: a${target.audioOrdinal} «${quoted}»`)
      ok++
      continue
    }

    try {
      await setDefaultAudioTrack(
        mkvpropedit,
        file,
        target.audioOrdinal,
        tracks.map((t) => t.audioOrdinal),
      )
      log(`[DONE] ${name} — default → a${target.audioOrdinal} «${quoted}»`)
      ok++
    } catch (err) {
      const line = `[FAIL] ${name} — ${err.message || err}`
      console.error(line)
      log(line)
      fail++
    }
  }

  log('')
  log(`Итого: ok=${ok}  warn=${warn}  fail=${fail}  всего=${scanCache.entries.length}`)
  return { ok, warn, fail, total: scanCache.entries.length }
}

module.exports = {
  applyTrack,
  setDefaultAudioTrack,
}
