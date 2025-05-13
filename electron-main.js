// electron-main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');

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

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,  
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
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
