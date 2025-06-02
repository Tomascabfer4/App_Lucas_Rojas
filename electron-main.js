// electron-main.js

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Ya no se utiliza electron-context-menu, menú contextual implementado manualmente más abajo
// Variable para mantener la referencia a la ventana principal
let mainWindowInstance;

// Sólo en entorno de desarrollo, cargamos electron-reload
if (!app.isPackaged) {
  try {
    require("electron-reload")(            
      path.join(__dirname, "www"), // Carpeta a observar en dev
      { electron: require(path.join(__dirname, "node_modules", "electron")) }
    );
  } catch (e) {
    console.warn(
      "[Main Process] electron-reload no pudo iniciarse:",
      e.message
    );
  }
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "icon", "icono.ico")
    : path.join(__dirname, "www", "assets", "icon", "icono.ico");

  const preloadScriptPath = path.join(__dirname, "preload.js");

  console.log(
    `[Main Process] Intentando cargar preload.js desde: ${preloadScriptPath}`
  );

  if (fs.existsSync(preloadScriptPath)) {
    console.log(
      `[Main Process] preload.js encontrado en: ${preloadScriptPath}`
    );
  } else {
    console.error(
      `[Main Process] ERROR: preload.js NO encontrado en la ruta: ${preloadScriptPath}`
    );
  }

  const newWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadScriptPath
    }
  });

    // Eliminamos menú principal
  newWindow.removeMenu();

  // Configuramos menú contextual manual sin dependencias ESM
  const { Menu } = require('electron');
  newWindow.webContents.on('context-menu', (event, params) => {
    const template = [
      { label: 'Copiar', role: 'copy' },
      { label: 'Cortar',  role: 'cut'  },
      { label: 'Pegar',   role: 'paste'},
      { type: 'separator' },
      { label: 'Inspeccionar Elemento', click: () => newWindow.webContents.inspectElement(params.x, params.y) }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: newWindow });
  });

  newWindow.maximize();

  // Carga el index.html de tu SPA Angular
  const indexPath = path.join(__dirname, "www", "index.html");
  newWindow.loadURL(`file://${indexPath}`);

  mainWindowInstance = newWindow;
  mainWindowInstance.on("closed", () => { mainWindowInstance = null; });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC HANDLERS ---

ipcMain.on("open-folder", async (event, folderPath) => {
  try {
    const result = await shell.openPath(folderPath);
    event.reply("open-folder-reply", { success: result === "", error: result });
  } catch (err) {
    event.reply("open-folder-reply", { success: false, error: err.message });
  }
});

ipcMain.on("reload-app-window", (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents) || mainWindowInstance;
  if (win) {
    const indexPath = path.join(__dirname, "www", "index.html");
    win.loadFile(indexPath).catch(err => console.error(err));
  } else {
    console.error("[Main Process] No se pudo determinar la ventana para recargar.");
  }
});
