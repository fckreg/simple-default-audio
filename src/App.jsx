import { useEffect, useMemo, useRef, useState } from 'react'
import { LOCALES, t } from './i18n/messages.js'

const PREFS_KEY = 'sda.prefs'

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { locale: 'en' }
    const parsed = JSON.parse(raw)
    return { locale: LOCALES.includes(parsed.locale) ? parsed.locale : 'en' }
  } catch {
    return { locale: 'en' }
  }
}

function api() {
  return window.simpleDefaultAudio
}

function stepClass(status) {
  return `step step-${status}`
}

export default function App() {
  const initial = useMemo(() => loadPrefs(), [])
  const [locale, setLocale] = useState(initial.locale)
  const [folder, setFolder] = useState('')
  const [tracks, setTracks] = useState([])
  const [trackId, setTrackId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState('')
  const [applied, setApplied] = useState(false)
  const logRef = useRef(null)
  const busy = scanning || running

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(PREFS_KEY, JSON.stringify({ locale }))
  }, [locale])

  useEffect(() => {
    if (!api()?.onLog) return undefined
    return api().onLog((line) => {
      setLog((prev) => (prev ? `${prev}\n${line}` : line))
    })
  }, [])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  async function scan(nextFolder) {
    if (busy) return
    setScanning(true)
    setTracks([])
    setTrackId('')
    setLog('')
    setApplied(false)
    try {
      const result = await api().scanFolder(nextFolder, locale)
      if (!result || result.cancelled || !result.ok) {
        if (result?.error) {
          setLog((prev) => (prev ? `${prev}\n[ERROR] ${result.error}` : `[ERROR] ${result.error}`))
        }
        return
      }
      const options = result.options || []
      setTracks(options)
      if (options.length === 1) setTrackId(options[0].id)
    } finally {
      setScanning(false)
    }
  }

  async function pickFolder() {
    if (busy) return
    const selected = await api().selectFolder(locale)
    if (!selected) return
    setFolder(selected)
    await scan(selected)
  }

  async function run() {
    if (!folder || !trackId || busy) return
    setRunning(true)
    setLog('')
    setApplied(false)
    try {
      const result = await api().applyTrack(folder, trackId, locale)
      if (result && !result.ok && result.error) {
        setLog((prev) => (prev ? `${prev}\n[ERROR] ${result.error}` : `[ERROR] ${result.error}`))
      } else {
        setApplied(true)
      }
    } finally {
      setRunning(false)
    }
  }

  const selectPlaceholder = scanning
    ? t(locale, 'scanning')
    : tracks.length
      ? t(locale, 'trackPick')
      : folder
        ? t(locale, 'trackNone')
        : t(locale, 'trackNeedFolder')

  const primaryLabel = scanning
    ? t(locale, 'scanning')
    : running
      ? t(locale, 'applying')
      : t(locale, 'apply')

  const step1 = folder ? 'done' : 'active'
  const step2 = !folder ? 'pending' : trackId ? 'done' : 'active'
  const step3 = applied ? 'done' : running || (folder && trackId) ? 'active' : 'pending'

  const folderName = folder
    ? folder.replace(/[/\\]+$/, '').split(/[/\\]/).pop() || folder
    : ''

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <p className="brand">{t(locale, 'brand')}</p>
            <p className="subtitle">{t(locale, 'subtitle')}</p>
          </div>
          <label className="pref">
            <span>{t(locale, 'language')}</span>
            <select
              className="pref-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              disabled={busy}
            >
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </label>
        </div>
      </header>

      <ol className="steps">
        <li className={stepClass(step1)}>
          <div className="step-rail" aria-hidden="true">
            <span className="step-dot">{step1 === 'done' ? '✓' : '1'}</span>
            <span className="step-line" />
          </div>
          <div className="step-body">
            <div className="step-head">
              <h2>{t(locale, 'step1')}</h2>
              <p>{t(locale, 'step1Hint')}</p>
            </div>
            <div className="step-card">
              <div className="row">
                <input
                  id="folder"
                  className="input"
                  value={folderName || folder}
                  title={folder}
                  readOnly
                  placeholder={t(locale, 'folderPlaceholder')}
                />
                <button type="button" className="btn secondary" onClick={pickFolder} disabled={busy}>
                  {t(locale, 'choose')}
                </button>
              </div>
            </div>
          </div>
        </li>

        <li className={stepClass(step2)}>
          <div className="step-rail" aria-hidden="true">
            <span className="step-dot">{step2 === 'done' ? '✓' : '2'}</span>
            <span className="step-line" />
          </div>
          <div className="step-body">
            <div className="step-head">
              <h2>{t(locale, 'step2')}</h2>
              <p>{t(locale, 'step2Hint')}</p>
            </div>
            <div className="step-card">
              <select
                id="track"
                className="select"
                value={trackId}
                onChange={(event) => {
                  setTrackId(event.target.value)
                  setApplied(false)
                }}
                disabled={busy || tracks.length === 0}
              >
                <option value="">{selectPlaceholder}</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.text}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn primary"
                onClick={run}
                disabled={!folder || !trackId || busy}
              >
                {primaryLabel}
              </button>
            </div>
          </div>
        </li>

        <li className={stepClass(step3)}>
          <div className="step-rail" aria-hidden="true">
            <span className="step-dot">{step3 === 'done' ? '✓' : '3'}</span>
          </div>
          <div className="step-body step-body-fill">
            <div className="step-head">
              <h2>{t(locale, 'step3')}</h2>
              <p>{t(locale, 'step3Hint')}</p>
            </div>
            <div className="step-card step-card-log">
              <pre ref={logRef} className="log">{log || t(locale, 'journalEmpty')}</pre>
            </div>
          </div>
        </li>
      </ol>
    </div>
  )
}
