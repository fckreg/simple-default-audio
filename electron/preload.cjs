const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('simpleDefaultAudio', {
  selectFolder: (locale) => ipcRenderer.invoke('select-folder', { locale }),
  scanFolder: (folder, locale) =>
    ipcRenderer.invoke('scan-folder', { folder, locale }),
  applyTrack: (folder, trackId, locale) =>
    ipcRenderer.invoke('apply-track', { folder, trackId, locale }),
  onLog: (callback) => {
    const handler = (_event, line) => callback(line)
    ipcRenderer.on('process-log', handler)
    return () => ipcRenderer.removeListener('process-log', handler)
  },
})
