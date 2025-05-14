const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  convertGCode: (data) => ipcRenderer.invoke('convert-gcode', data),
});