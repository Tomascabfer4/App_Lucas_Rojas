// electron-main.js

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Sólo en entorno de desarrollo, cargamos electron-reload
if (!app.isPackaged) {
  try {
    require('electron-reload')(
      path.join(__dirname, 'www'),
      { electron: require(path.join(__dirname, 'node_modules', 'electron')) }
    );
  } catch {}
}

function createWindow() {
    const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon', 'icono.ico')
    : path.join(__dirname, 'www', 'assets', 'icon', 'icono.ico');  

    // >>> Depuración de la ruta del preload script <<<
  // app.getAppPath() apunta a la raíz del directorio de la aplicación empaquetada.
  // path.join() construye la ruta completa al archivo 'preload.js' dentro de ese directorio.
  const preloadScriptPath = path.join(app.getAppPath(), 'preload.js');

  console.log(`[Main Process] app.getAppPath(): ${app.getAppPath()}`); // Log de la raíz de la app empaquetada
  console.log(`[Main Process] Ruta calculada para preload.js: ${preloadScriptPath}`); // Log de la ruta completa calculada

  // Verificar si el archivo preload.js existe en la ruta calculada en tiempo de ejecución
  if (fs.existsSync(preloadScriptPath)) {
    console.log(`[Main Process] preload.js encontrado en: ${preloadScriptPath}`);
  } else {
    console.error(`[Main Process] ERROR: preload.js NO encontrado en la ruta calculada: ${preloadScriptPath}`);
    // Este log es CRÍTICO. Si aparece en producción, el archivo no está donde se espera.
    // Considera mostrar un error al usuario o salir de la aplicación si el preload script es crítico
  }
  // >>> Fin Depuración <<<


  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,  
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadScriptPath
      // opcional: deshabilita por completo DevTools
      // devTools: false
    }
  });

  mainWindow.removeMenu();// Elimina el menú de la aplicación
  mainWindow.maximize();// Maximiza la ventana

  const indexPath = path.join(__dirname, 'www', 'index.html');
  mainWindow.loadURL(`file://${indexPath}`);

  // Sólo en dev y **si realmente lo necesitas**, 
  // sino comenta esta línea
  if (!app.isPackaged) {
    // Puedes usar {mode:'detach'} para separarlo
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// >>> MANEJADOR IPC PARA ABRIR CARPETA <<<
// Este escucha el evento 'open-folder' enviado desde el renderer
ipcMain.on('open-folder', async (event, folderPath) => {
  try {
    const success = await shell.openPath(folderPath);
    // shell.openPath devuelve una cadena vacía si tiene éxito, o un mensaje de error si falla
    if (success === '') {
      event.reply('open-folder-reply', { success: true });
    } else {
      event.reply('open-folder-reply', { success: false, error: success });
    }
  } catch (error) {
    event.reply('open-folder-reply', { success: false, error: error.message });
  }
});