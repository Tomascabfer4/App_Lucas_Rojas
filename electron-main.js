// electron-main.js

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Variable para mantener la referencia a la ventana principal
let mainWindowInstance;

// Sólo en entorno de desarrollo, cargamos electron-reload
if (!app.isPackaged) {
  try {
    require("electron-reload")(
      path.join(__dirname, "www"), // Asegúrate que esta es la carpeta a observar
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
    ? path.join(process.resourcesPath, "assets", "icon", "icono.ico") // En producción, los assets pueden estar en process.resourcesPath
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
      `[Main Process] ERROR: preload.js NO encontrado en la ruta: ${preloadScriptPath}. Verifica la ruta.`
    );
  }

  const newWindow = new BrowserWindow({
    // Cambiado de mainWindow a newWindow para evitar conflicto de scope inicial
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadScriptPath,
      // devTools: !app.isPackaged // Habilita DevTools solo si no está empaquetado
    },
  });

  newWindow.removeMenu();
  newWindow.maximize();

  // Carga el index.html de tu aplicación Angular
  // Esta es la ruta correcta al punto de entrada de tu SPA
  const indexPath = path.join(__dirname, "www", "index.html");
  newWindow.loadURL(`file://${indexPath}`);

  if (!app.isPackaged) {
    // newWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Asigna la instancia a la variable global/module-level
  mainWindowInstance = newWindow;

  mainWindowInstance.on("closed", () => {
    mainWindowInstance = null; // Limpia la referencia cuando la ventana se cierra
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // En macOS es común que las aplicaciones y su barra de menú
  // permanezcan activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // En macOS es común volver a crear una ventana en la aplicación cuando el
  // icono del dock se presiona y no hay otras ventanas abiertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- MANEJADORES IPC ---

// MANEJADOR IPC PARA ABRIR CARPETA
ipcMain.on("open-folder", async (event, folderPath) => {
  try {
    const resultMessage = await shell.openPath(folderPath); // shell.openPath devuelve string vacío en éxito o mensaje de error
    if (resultMessage === "") {
      event.reply("open-folder-reply", { success: true });
    } else {
      console.error(
        `[Main Process] Error al abrir carpeta '${folderPath}': ${resultMessage}`
      );
      event.reply("open-folder-reply", {
        success: false,
        error: resultMessage,
      });
    }
  } catch (error) {
    console.error(
      `[Main Process] Excepción al abrir carpeta '${folderPath}':`,
      error
    );
    event.reply("open-folder-reply", { success: false, error: error.message });
  }
});

// <<< NUEVO MANEJADOR IPC PARA RECARGAR LA PÁGINA >>>
// Este manejador ahora carga el index.html en lugar de usar win.reload()
ipcMain.on("reload-app-window", (event) => {
  // La forma más robusta es obtener la ventana desde el 'event.sender'
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);

  if (win) {
    console.log(
      "[Main Process] Recibida solicitud para recargar ventana. Cargando index.html..."
    );
    // >>> Cargar el archivo index.html, que es el punto de entrada de tu SPA Angular <<<
    const indexPath = path.join(__dirname, "www", "index.html"); // Asegúrate que 'www' es tu carpeta de build

    win
      .loadFile(indexPath) // Usa loadFile para cargar un archivo local
      .then(() => {
        console.log(
          "[Main Process] index.html cargado con éxito después de recarga."
        );
        // Opcional: Si necesitas navegar a una ruta específica de Angular después de la recarga,
        // podrías enviar otro mensaje IPC al renderer una vez que la página cargue.
      })
      .catch((err) => {
        console.error(
          "[Main Process] Error al cargar index.html después de recarga:",
          err
        );
        // Considera informar al usuario en el renderer si la recarga falla críticamente
      });
  } else if (mainWindowInstance) {
    // Fallback por si BrowserWindow.fromWebContents no funciona (raro)
    // o si quieres recargar explícitamente la instancia principal guardada.
    console.log(
      "[Main Process] Recibida solicitud para recargar (fallback a mainWindowInstance). Cargando index.html..."
    );
    const indexPath = path.join(__dirname, "www", "index.html"); // Asegúrate que 'www' es tu carpeta de build
    mainWindowInstance
      .loadFile(indexPath)
      .then(() => {
        console.log(
          "[Main Process] index.html loaded successfully after fallback reload."
        );
      })
      .catch((err) => {
        console.error(
          "[Main Process] Error reloading index.html in fallback:",
          err
        );
      });
  } else {
    console.error(
      "[Main Process] No se pudo determinar la ventana para recargar."
    );
  }
});
