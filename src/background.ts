'use strict';

import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  clipboard,
  Rectangle,
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let controllerWindow: BrowserWindow | null;
let paperWindow: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

function createWindow() {
  // Create the browser window.
  controllerWindow = new BrowserWindow({
    width: 240,
    height: 320,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  paperWindow = new BrowserWindow({
    useContentSize: true,
    frame: false,
    hasShadow: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false,
  });

  let urlPrefix: string;

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    urlPrefix = process.env.WEBPACK_DEV_SERVER_URL as string;
  } else {
    createProtocol('app');
    urlPrefix = 'app://./';
  }

  controllerWindow.loadURL(`${urlPrefix}#/dropper`);
  paperWindow.loadURL(`${urlPrefix}#/paper`);

  controllerWindow.on('closed', () => {
    controllerWindow = null;
  });

  paperWindow.on('moved', () => {
    if (!controllerWindow || !paperWindow) return;
    controllerWindow.webContents.send(
      'window-rectangle',
      paperWindow.getBounds()
    );
  });

  paperWindow.on('will-resize', (_: Event, rectangle: Rectangle) => {
    if (!controllerWindow) return;
    controllerWindow.webContents.send('window-rectangle', rectangle);
  });

  ipcMain.on('renderer-event', (_, event: string, payload: any) => {
    if (!paperWindow || !controllerWindow) return;
    switch (event) {
      case 'set-opacity':
        paperWindow.webContents.send(event, payload);
        break;
      case 'toggle-clickthrough':
        paperWindow.setIgnoreMouseEvents(payload.toggle);
        paperWindow.setAlwaysOnTop(payload.toggle);
        break;
      case 'set-bounds':
        paperWindow.setBounds(payload);
        break;
      case 'set-position':
        paperWindow.setBounds(payload);
        break;
      case 'set-image':
        if (payload.type === 'clipboard') {
          const image = clipboard.readImage();
          payload.data = image.toDataURL();
        }

        paperWindow.show();
        paperWindow.webContents.send(event, payload);
        controllerWindow.webContents.send(
          'window-rectangle',
          paperWindow.getBounds()
        );
        break;
      case 'set-image-size':
        paperWindow.setSize(payload.width, payload.height);
        break;
    }
  });

  controllerWindow.on('closed', () => {
    app.quit();
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (controllerWindow === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
