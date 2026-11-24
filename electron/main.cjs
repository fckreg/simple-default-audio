const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { scanFolder, applyTrack } = require('./media/index.cjs')

const distIndex = path.join(__dirname, '..', 'dist', 'index.html')
const useViteDev = process.env.ELECTRON_DEV === '1' && !app.isPackaged

/** BatchJob busy lock: idle → scanning|applying → idle */
let jobState = 'idle'
let scanSeq = 0

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 680,
    minWidth: 600,
    minHeight: 520,
    title: 'TrackDefault',
    backgroundColor: '#1a1f24',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.setMenuBarVisibility(false)

  if (useViteDev) {
    win.loadURL('http://127.0.0.1:5173')
  } else if (fs.existsSync(distIndex)) {
    win.loadFile(distIndex)
  } else {
    throw new Error(`Не найден UI: ${distIndex}`)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function sendProcessLog(event, line) {
  if (!event.sender.isDestroyed()) {
    event.sender.send('process-log', line)
  }
}

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Выберите папку с видео',
    properties: ['openDirectory'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
})

ipcMain.handle('scan-folder', async (event, { folder, recurse }) => {
  if (jobState !== 'idle') {
    return { ok: false, error: 'Уже выполняется другая операция. Дождитесь завершения.' }
  }

  jobState = 'scanning'
  const seq = ++scanSeq
  const sendLog = (line) => {
    if (seq !== scanSeq) return
    sendProcessLog(event, line)
  }

  try {
    const summary = await scanFolder(folder, {
      recurse: Boolean(recurse),
      onLog: sendLog,
      isCancelled: () => seq !== scanSeq,
    })
    if (summary.cancelled || seq !== scanSeq) return { ok: false, cancelled: true }
    return { ok: true, ...summary }
  } catch (err) {
    if (seq !== scanSeq) return { ok: false, cancelled: true }
    sendLog(`[ERROR] ${err.message || err}`)
    return { ok: false, error: String(err.message || err) }
  } finally {
    if (seq === scanSeq) jobState = 'idle'
  }
})

ipcMain.handle('apply-track', async (event, { folder, recurse, trackId }) => {
  if (jobState !== 'idle') {
    return { ok: false, error: 'Уже выполняется другая операция. Дождитесь завершения.' }
  }

  jobState = 'applying'
  const sendLog = (line) => sendProcessLog(event, line)

  try {
    const summary = await applyTrack(folder, trackId, {
      recurse: Boolean(recurse),
      onLog: sendLog,
    })
    return { ok: true, summary }
  } catch (err) {
    sendLog(`[ERROR] ${err.message || err}`)
    return { ok: false, error: String(err.message || err) }
  } finally {
    jobState = 'idle'
  }
})
