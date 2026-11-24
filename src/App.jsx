import { useEffect, useRef, useState } from 'react'

export default function App() {
  const [folder, setFolder] = useState('')
  const [recurse, setRecurse] = useState(false)
  const [tracks, setTracks] = useState([])
  const [trackId, setTrackId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState('')
  const logRef = useRef(null)
  const busy = scanning || running

  useEffect(() => {
    if (!window.trackdefault?.onLog) return undefined
    return window.trackdefault.onLog((line) => {
      setLog((prev) => (prev ? `${prev}\n${line}` : line))
    })
  }, [])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log])

  async function scan(nextFolder, nextRecurse) {
    if (busy) return
    setScanning(true)
    setTracks([])
    setTrackId('')
    setLog('')
    try {
      const result = await window.trackdefault.scanFolder(nextFolder, nextRecurse)
      if (!result || result.cancelled || !result.ok) {
        if (result?.error) setLog((prev) => (prev ? `${prev}\n[ERROR] ${result.error}` : `[ERROR] ${result.error}`))
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
    const selected = await window.trackdefault.selectFolder()
    if (!selected) return
    setFolder(selected)
    await scan(selected, recurse)
  }

  function onRecurseChange(event) {
    if (busy) return
    const next = event.target.checked
    setRecurse(next)
    if (folder) scan(folder, next)
  }

  async function run() {
    if (!folder || !trackId || busy) return
    setRunning(true)
    setLog('')
    try {
      const result = await window.trackdefault.applyTrack(folder, recurse, trackId)
      if (result && !result.ok && result.error) {
        setLog((prev) => (prev ? `${prev}\n[ERROR] ${result.error}` : `[ERROR] ${result.error}`))
      }
    } finally {
      setRunning(false)
    }
  }

  const selectPlaceholder = scanning
    ? 'Сканирование…'
    : tracks.length
      ? 'Выберите дорожку'
      : folder
        ? 'Дорожки не найдены'
        : 'Сначала выберите папку'

  return (
    <div className="app">
      <header className="header">
        <p className="brand">TrackDefault</p>
        <h1>Выбор аудиодорожки</h1>
        <p>Ставит выбранную дорожку default в MKV без пересборки</p>
      </header>

      <section className="panel">
        <label className="label" htmlFor="folder">Папка с видео</label>
        <div className="row">
          <input
            id="folder"
            className="input"
            value={folder}
            readOnly
            placeholder="Не выбрана"
          />
          <button type="button" className="btn secondary" onClick={pickFolder} disabled={busy}>
            Выбрать…
          </button>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={recurse}
            onChange={onRecurseChange}
            disabled={busy}
          />
          Включая подпапки
        </label>

        <label className="label" htmlFor="track">Аудиодорожка</label>
        <select
          id="track"
          className="select"
          value={trackId}
          onChange={(event) => setTrackId(event.target.value)}
          disabled={busy || tracks.length === 0}
        >
          <option value="">{selectPlaceholder}</option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id}>
              {track.text}
            </option>
          ))}
        </select>
        <p className="hint">
          Список собран по паре язык + название во всех MKV. Если в файле такой дорожки нет — в журнале будет предупреждение, остальные файлы обновятся.
        </p>

        <button
          type="button"
          className="btn primary"
          onClick={run}
          disabled={!folder || !trackId || busy}
        >
          {scanning ? 'Сканирование…' : running ? 'Применение…' : 'Сделать дорожкой по умолчанию'}
        </button>
      </section>

      <section className="log-wrap">
        <div className="label">Журнал</div>
        <pre ref={logRef} className="log">{log || 'Выберите папку — дорожки прочитаются из заголовков, без пересборки.'}</pre>
      </section>
    </div>
  )
}
