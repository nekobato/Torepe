import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  clipboard,
  Rectangle,
  Menu,
  dialog,
} from 'electron';
import { release } from 'os';
import { join } from 'path';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let controllerWindow: BrowserWindow | null;
let paperWindow: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

const menu = Menu.buildFromTemplate([{ role: 'appMenu' }]);
Menu.setApplicationMenu(menu);

function createWindow() {
  // Create the browser window.
  controllerWindow = new BrowserWindow({
    title: 'Torepe - Controller',
    width: 240,
    height: 440,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      devTools: isDevelopment,
    },
  });

  paperWindow = new BrowserWindow({
    title: 'Torepe - Image',
    frame: false,
    hasShadow: false,
    transparent: true,
    resizable: true,
    roundedCorners: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      nodeIntegration: true,
      devTools: isDevelopment,
    },
    show: false,
  });

  let urlPrefix: string;

  if (process.env.NODE_ENV === 'development') {
    urlPrefix = 'http://localhost:3000/';
  } else {
    urlPrefix = require('url').format({
      protocol: 'file',
      slashes: true,
      pathname: require('path').join(__dirname, '../renderer/index.html'),
    });
  }

  controllerWindow.loadURL(`${urlPrefix}#/dropper`);
  paperWindow.loadURL(`${urlPrefix}#/paper`);

  controllerWindow.on('closed', () => {
    controllerWindow = null;
  });

  paperWindow.on('moved', () => {
    if (!controllerWindow || !paperWindow) return;
    controllerWindow.webContents.send('window-rectangle', {
      ...paperWindow.getBounds(),
      original: false,
    });
  });

  paperWindow.on('will-resize', (_, rectangle) => {
    if (!controllerWindow) return;
    controllerWindow.webContents.send('window-rectangle', {
      ...rectangle,
      original: false,
    });
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
          if (image.isEmpty()) {
            dialog.showErrorBox(
              'クリップボードに画像がありません',
              '画像をコピーしてから再度お試しください'
            );
            return;
          }

          payload.data = image.toDataURL();
        }

        paperWindow.show();
        paperWindow.webContents.send(event, payload);

        controllerWindow.webContents?.send('goto-controller');
        break;
      case 'set-image-size':
        paperWindow.setSize(payload.width, payload.height);
        controllerWindow.webContents.send('window-rectangle', {
          x: paperWindow.getBounds().x,
          y: paperWindow.getBounds().y,
          width: payload.width,
          height: payload.height,
          original: true,
        });
        break;
      case 'reset-image':
        paperWindow.hide();
        break;
      case 'link-aspect':
        const { link, ratio } = payload;
        if (link) {
          paperWindow.setAspectRatio(ratio);
        } else {
          paperWindow.setAspectRatio(0);
        }
    }
  });

  if (process.env.NODE_ENV === 'development') {
    controllerWindow.webContents.openDevTools();
    paperWindow.webContents.openDevTools();
  }

  controllerWindow.on('closed', () => {
    app.quit();
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (controllerWindow === null) {
    createWindow();
  }
});

app.on('ready', async () => {
  createWindow();
});

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
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
