const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('trackdefault', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folder, recurse) =>
    ipcRenderer.invoke('scan-folder', { folder, recurse }),
  applyTrack: (folder, recurse, trackId) =>
    ipcRenderer.invoke('apply-track', { folder, recurse, trackId }),
  onLog: (callback) => {
    const handler = (_event, line) => callback(line)
    ipcRenderer.on('process-log', handler)
    return () => ipcRenderer.removeListener('process-log', handler)
  },
})
