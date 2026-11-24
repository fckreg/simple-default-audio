const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { scanFolder, applyTrack } = require('./media/index.cjs')
const { t, normalizeLocale } = require('./i18n/messages.cjs')

const distIndex = path.join(__dirname, '..', 'dist', 'index.html')
const useViteDev = process.env.ELECTRON_DEV === '1' && !app.isPackaged
const iconPath = path.join(__dirname, '..', 'build', 'icon.ico')

/** BatchJob busy lock: idle → scanning|applying → idle */
let jobState = 'idle'
let scanSeq = 0

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 720,
    minWidth: 640,
    minHeight: 560,
    title: 'SimpleDefaultAudio',
    backgroundColor: '#12171c',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
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
    throw new Error(`UI not found: ${distIndex}`)
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32' && fs.existsSync(iconPath)) {
    app.setAppUserModelId('com.simpledefaultaudio.app')
  }
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

ipcMain.handle('select-folder', async (_event, payload = {}) => {
  const locale = normalizeLocale(payload?.locale)
  const result = await dialog.showOpenDialog({
    title: t(locale, 'selectFolderTitle'),
    properties: ['openDirectory'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
})

ipcMain.handle('scan-folder', async (event, { folder, locale }) => {
  const loc = normalizeLocale(locale)
  if (jobState !== 'idle') {
    return { ok: false, error: t(loc, 'busy') }
  }

  jobState = 'scanning'
  const seq = ++scanSeq
  const sendLog = (line) => {
    if (seq !== scanSeq) return
    sendProcessLog(event, line)
  }

  try {
    const summary = await scanFolder(folder, {
      locale: loc,
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

ipcMain.handle('apply-track', async (event, { folder, trackId, locale }) => {
  const loc = normalizeLocale(locale)
  if (jobState !== 'idle') {
    return { ok: false, error: t(loc, 'busy') }
  }

  jobState = 'applying'
  const sendLog = (line) => sendProcessLog(event, line)

  try {
    const summary = await applyTrack(folder, trackId, {
      locale: loc,
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
