/**
 * TrackIdentity helpers — languageNorm + titleNorm define identity (not title-only).
 * See data-model.md TrackIdentity / AudioTrackOption.
 */

function norm(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** TrackIdentity.languageNorm */
function languageNorm(track) {
  return norm(track?.language)
}

/** TrackIdentity.titleNorm */
function titleNorm(track) {
  return norm(track?.title)
}

/**
 * TrackIdentity.key = languageNorm + '\u001f' + titleNorm
 * Empty language and/or title allowed; both fields must match to share a key.
 */
function trackKey(track) {
  return `${languageNorm(track)}\u001f${titleNorm(track)}`
}

function formatLabel(track) {
  const title = track.title?.trim() || ''
  const language = track.language?.trim() || ''
  const parts = [title || 'без названия']
  if (language) parts.push(language)
  if (track.codec) parts.push(track.codec)
  if (track.channels) parts.push(`${track.channels} ch`)
  return parts.join(' · ')
}

/**
 * Build AudioTrackOption rows from FileEntry[] keyed by TrackIdentity.key.
 */
function buildOptions(entries, total) {
  const map = new Map()
  for (const entry of entries) {
    const seen = new Set()
    for (const track of entry.tracks || []) {
      const key = track.key || trackKey(track)
      if (seen.has(key)) continue
      seen.add(key)

      let bucket = map.get(key)
      if (!bucket) {
        bucket = {
          key,
          title: (track.title || '').trim(),
          language: (track.language || '').trim(),
          languages: new Set(),
          codec: track.codec || '',
          channels: track.channels || 0,
          fileCount: 0,
        }
        map.set(key, bucket)
      }
      const language = languageNorm(track)
      if (language) bucket.languages.add(language)
      if (!bucket.title && track.title) bucket.title = String(track.title).trim()
      bucket.fileCount++
    }
  }

  const options = [...map.values()]
    .map((bucket) => {
      const languages = [...bucket.languages].sort((a, b) => a.localeCompare(b, 'ru'))
      const language = languages.length <= 1
        ? (bucket.language || languages[0] || '')
        : languages.join('/')
      const view = {
        key: bucket.key,
        title: bucket.title,
        language,
        codec: bucket.codec,
        channels: bucket.channels,
        fileCount: bucket.fileCount,
      }
      view.label = formatLabel(view)
      view.text = `${view.label} — ${view.fileCount} из ${total}`
      return view
    })
    .sort((a, b) => b.fileCount - a.fileCount || a.label.localeCompare(b.label, 'ru'))

  options.forEach((opt, index) => {
    opt.id = String(index)
  })
  return options
}

function publicOption(opt) {
  return {
    id: opt.id,
    label: opt.label,
    text: opt.text,
    title: opt.title,
    language: opt.language,
    codec: opt.codec,
    channels: opt.channels,
    fileCount: opt.fileCount,
  }
}

module.exports = {
  norm,
  languageNorm,
  titleNorm,
  trackKey,
  formatLabel,
  buildOptions,
  publicOption,
}
