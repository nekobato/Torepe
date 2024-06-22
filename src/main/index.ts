import {
  BrowserWindow,
  Menu,
  app,
  clipboard,
  dialog,
  ipcMain,
  protocol,
} from "electron";
import { release } from "os";
import log from "electron-log";
import { checkUpdate } from "./autoupdater";
import { pageRoot, preload } from "./static";
const isDevelopment = process.env.NODE_ENV === "development";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let controllerWindow: BrowserWindow | null;
let paperWindow: BrowserWindow | null;

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

checkUpdate();

const menu = Menu.buildFromTemplate([{ role: "appMenu" }]);
Menu.setApplicationMenu(menu);

function createWindow() {
  controllerWindow = new BrowserWindow({
    title: "Torepe",
    width: 240,
    height: 240,
    resizable: false,
    webPreferences: {
      preload: preload,
    },
  });

  paperWindow = new BrowserWindow({
    title: "Torepe",
    frame: false,
    hasShadow: false,
    transparent: true,
    resizable: true,
    roundedCorners: false,
    webPreferences: {
      preload: preload,
    },
    alwaysOnTop: true,
    show: false,
  });

  if (isDevelopment) {
    controllerWindow.loadURL(pageRoot + "#/dropper");
    paperWindow.loadURL(pageRoot + "#/paper");
    controllerWindow.webContents.openDevTools();
    paperWindow.webContents.openDevTools();
  } else {
    controllerWindow.loadFile(pageRoot, { hash: "/dropper" });
    paperWindow.loadFile(pageRoot, { hash: "/paper" });
  }

  controllerWindow.on("closed", () => {
    controllerWindow = null;
  });

  paperWindow.on("moved", () => {
    if (!controllerWindow || !paperWindow) return;
    controllerWindow.webContents.send("window-rectangle", {
      ...paperWindow.getBounds(),
      original: false,
    });
  });

  paperWindow.on("will-resize", (_, rectangle) => {
    if (!controllerWindow) return;
    controllerWindow.webContents.send("window-rectangle", {
      ...rectangle,
      original: false,
    });
  });

  ipcMain.on("renderer-event", (_, event: string, payload: any) => {
    if (!paperWindow || !controllerWindow) return;
    switch (event) {
      case "set-opacity":
        paperWindow.webContents.send(event, payload);
        break;
      case "toggle-clickthrough":
        paperWindow.setIgnoreMouseEvents(payload.toggle);
        paperWindow.setAlwaysOnTop(payload.toggle);
        break;
      case "set-bounds":
        paperWindow.setBounds(payload);
        break;
      case "set-position":
        paperWindow.setBounds(payload);
        break;
      case "move-position":
        const bounds = paperWindow.getBounds();
        paperWindow.setBounds({
          ...bounds,
          x: bounds.x + payload.x,
          y: bounds.y + payload.y,
        });
        break;
      case "set-image":
        if (payload.type === "clipboard") {
          const image = clipboard.readImage();
          if (image.isEmpty()) {
            dialog.showErrorBox(
              "クリップボードに画像がありません",
              "画像をコピーしてから再度お試しください"
            );
            return;
          }

          payload.data = image.toDataURL();
        }

        paperWindow.center();
        paperWindow.show();
        paperWindow.webContents.send(event, payload);

        controllerWindow.webContents?.send("goto-controller");
        break;
      case "set-image-size":
        paperWindow.setSize(payload.width, payload.height);
        controllerWindow.webContents.send("window-rectangle", {
          x: paperWindow.getBounds().x,
          y: paperWindow.getBounds().y,
          width: payload.width,
          height: payload.height,
          original: true,
        });
        break;
      case "reset-image":
        paperWindow.hide();
        break;
      case "link-aspect":
        const { link, ratio } = payload;
        if (link) {
          paperWindow.setAspectRatio(ratio);
        } else {
          paperWindow.setAspectRatio(0);
        }
      case "error":
        log.error(payload);
        break;
    }
  });

  controllerWindow.on("closed", () => {
    app.quit();
  });
}

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (controllerWindow === null) {
    createWindow();
  }
});

app.on("ready", async () => {
  createWindow();
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
