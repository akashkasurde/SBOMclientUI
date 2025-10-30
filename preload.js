const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  showSaveDialog: (format) => ipcRenderer.invoke('show-save-dialog', format),
  runSyft: (dirPath, format, outputPath) => ipcRenderer.invoke('run-syft', dirPath, format, outputPath),
  saveOrgCode: (orgCode) => ipcRenderer.invoke('save-org-code', orgCode),
  getOrgCode: () => ipcRenderer.invoke('get-org-code')
});