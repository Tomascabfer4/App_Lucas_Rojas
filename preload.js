// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Lista de canales válidos para enviar mensajes desde el renderer al main
const validSendChannels = ['open-folder', 'reload-app-window'];
// Lista de canales válidos para recibir mensajes desde el main al renderer
const validReceiveChannels = ['open-folder-reply'];

contextBridge.exposeInMainWorld('electronAPI', {
  // Función para enviar mensajes genéricos (con validación de canal)
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`[Preload] Intento de enviar por un canal no válido: ${channel}`);
    }
  },
  // Función para escuchar mensajes genéricos (con validación de canal)
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Para evitar múltiples listeners en el mismo canal si se llama varias veces
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    } else {
      console.warn(`[Preload] Intento de escuchar en un canal no válido: ${channel}`);
    }
  },

  // Manteniendo tus funciones existentes si aún las usas directamente,
  // aunque es mejor usar las genéricas 'send' y 'on' si es posible.
  // Si prefieres mantenerlas explícitas:
  openFolder: (folderPath) => {
    if (validSendChannels.includes('open-folder')) {
      ipcRenderer.send('open-folder', folderPath);
    }
  },
  onOpenFolderReply: (callback) => {
    if (validReceiveChannels.includes('open-folder-reply')) {
      ipcRenderer.removeAllListeners('open-folder-reply'); // Evita duplicados
      ipcRenderer.on('open-folder-reply', (event, args) => callback(args));
    }
  }
});

// Puedes exponer otras APIs de Electron aquí si es necesario,
// siempre de forma controlada y segura usando contextBridge.