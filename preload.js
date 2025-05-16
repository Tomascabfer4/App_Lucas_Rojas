// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Exponer una API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Exponer una función llamada 'openFolder' que el renderer puede llamar
  openFolder: (folderPath) => {
    // Enviar un mensaje al main process a través de IPC
    ipcRenderer.send('open-folder', folderPath);
  },
  // Opcional: Escuchar respuestas del main process (ej. si la operación fue exitosa)
  onOpenFolderReply: (callback) => ipcRenderer.on('open-folder-reply', (event, args) => callback(args))
});

// Puedes exponer otras APIs de Electron aquí si es necesario,
// siempre de forma controlada y segura usando contextBridge.
