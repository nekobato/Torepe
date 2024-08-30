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
import { createWindow as createPaperWindow } from "./paperWindow";

const isDevelopment = process.env.NODE_ENV === "development";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let paperWindows: BrowserWindow[] = [];

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

checkUpdate();

const menu = Menu.buildFromTemplate([{ role: "appMenu" }]);
Menu.setApplicationMenu(menu);

function initEvents() {
  ipcMain.on("renderer-event", (_, event: string, payload: any) => {
    if (paperWindows.length === 0) return;
    switch (event) {
      case "toggle-clickthrough":
        paperWindows[payload.windowIndex].setIgnoreMouseEvents(payload.toggle);
        paperWindows[payload.windowIndex].setAlwaysOnTop(payload.toggle);
        break;
      case "set-bounds":
        paperWindows[payload.windowIndex].setBounds(payload);
        break;
      case "set-position":
        paperWindows[payload.windowIndex].setBounds(payload);
        break;
      case "move-position":
        const bounds = paperWindows[payload.windowIndex].getBounds();
        paperWindows[payload.windowIndex].setBounds({
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

        paperWindows[payload.windowIndex].center();
        paperWindows[payload.windowIndex].show();
        paperWindows[payload.windowIndex].webContents.send(event, payload);
        break;
      case "set-image-size":
        paperWindows[payload.windowIndex].setSize(
          payload.width,
          payload.height
        );
        break;
      case "link-aspect":
        const { link, ratio } = payload;
        if (link) {
          paperWindows[payload.windowIndex].setAspectRatio(ratio);
        } else {
          paperWindows[payload.windowIndex].setAspectRatio(0);
        }
        break;
      case "close":
        paperWindows[payload.windowIndex].close();
        break;
      case "error":
        log.error(payload);
        break;
    }
  });
}

function addPaperWindow() {
  const paperWindow = createPaperWindow();
  paperWindows?.push(paperWindow);
}

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (paperWindows.length === 0) {
    addPaperWindow();
  }
});

app.on("ready", async () => {
  initEvents();
  addPaperWindow();
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
