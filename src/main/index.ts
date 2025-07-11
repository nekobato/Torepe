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
import type { PaperWindowState } from "../shared/types/window";
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
const paperWindows = new Map<string, BrowserWindow>();
let windowIdCounter = 0;

function generateWindowId(): string {
  return `window-${++windowIdCounter}`;
}

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

checkUpdate();

const menu = Menu.buildFromTemplate([{ role: "appMenu" }]);
Menu.setApplicationMenu(menu);

function createPaperWindow(): string {
  const windowId = generateWindowId();
  const paperWindow = new BrowserWindow({
    title: `Torepe - ${windowId}`,
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

  paperWindows.set(windowId, paperWindow);

  if (isDevelopment) {
    paperWindow.loadURL(pageRoot + "#/paper");
    paperWindow.webContents.openDevTools();
  } else {
    paperWindow.loadFile(pageRoot, { hash: "/paper" });
  }

  // Set up event handlers for this window
  paperWindow.on("closed", () => {
    paperWindows.delete(windowId);
    if (controllerWindow && !controllerWindow.isDestroyed()) {
      controllerWindow.webContents.send("paper-window-closed", windowId);
    }
  });

  paperWindow.on("focus", () => {
    if (controllerWindow && !controllerWindow.isDestroyed()) {
      controllerWindow.webContents.send("paper-window-focused", windowId);
    }
  });

  paperWindow.on("moved", () => {
    if (!controllerWindow || controllerWindow.isDestroyed()) return;
    controllerWindow.webContents.send("window-rectangle", {
      windowId,
      ...paperWindow.getBounds(),
      original: false,
    });
  });

  paperWindow.on("will-resize", (_, rectangle) => {
    if (!controllerWindow || controllerWindow.isDestroyed()) return;
    controllerWindow.webContents.send("window-rectangle", {
      windowId,
      ...rectangle,
      original: false,
    });
  });

  // Notify controller about new window
  if (controllerWindow && !controllerWindow.isDestroyed()) {
    const windowState: PaperWindowState = {
      id: windowId,
      windowId: paperWindow.id,
      title: `Window ${windowIdCounter}`,
      bounds: paperWindow.getBounds(),
      opacity: 1,
      clickThrough: false,
      isActive: true,
    };
    controllerWindow.webContents.send("paper-window-created", windowState);
  }

  return windowId;
}

function createWindow() {
  controllerWindow = new BrowserWindow({
    title: "Torepe",
    width: 240,
    height: 400,
    resizable: false,
    webPreferences: {
      preload: preload,
    },
  });

  // Don't create paper window automatically - let controller create it

  if (isDevelopment) {
    controllerWindow.loadURL(pageRoot);
    controllerWindow.webContents.openDevTools();
  } else {
    controllerWindow.loadFile(pageRoot);
  }

  controllerWindow.on("closed", () => {
    controllerWindow = null;
  });

  // New IPC handlers for multi-window
  ipcMain.handle("create-paper-window", () => {
    return createPaperWindow();
  });

  ipcMain.handle("create-paper-window-with-id", (_, windowId: string) => {
    const paperWindow = new BrowserWindow({
      title: `Torepe - ${windowId}`,
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

    paperWindows.set(windowId, paperWindow);

    if (isDevelopment) {
      paperWindow.loadURL(pageRoot + "#/paper");
      paperWindow.webContents.openDevTools();
    } else {
      paperWindow.loadFile(pageRoot, { hash: "/paper" });
    }

    // Set up event handlers for this window
    paperWindow.on("closed", () => {
      paperWindows.delete(windowId);
      if (controllerWindow && !controllerWindow.isDestroyed()) {
        controllerWindow.webContents.send("paper-window-closed", windowId);
      }
    });

    paperWindow.on("focus", () => {
      if (controllerWindow && !controllerWindow.isDestroyed()) {
        controllerWindow.webContents.send("paper-window-focused", windowId);
      }
    });

    paperWindow.on("moved", () => {
      if (!controllerWindow || controllerWindow.isDestroyed()) return;
      controllerWindow.webContents.send("window-rectangle", {
        windowId,
        ...paperWindow.getBounds(),
        original: false,
      });
    });

    paperWindow.on("will-resize", (_, rectangle) => {
      if (!controllerWindow || controllerWindow.isDestroyed()) return;
      controllerWindow.webContents.send("window-rectangle", {
        windowId,
        ...rectangle,
        original: false,
      });
    });

    // Notify controller about new window
    if (controllerWindow && !controllerWindow.isDestroyed()) {
      const windowState: PaperWindowState = {
        id: windowId,
        windowId: paperWindow.id,
        title: `Window ${windowId.split('-')[1]}`,
        bounds: paperWindow.getBounds(),
        opacity: 1,
        clickThrough: false,
        isActive: true,
      };
      controllerWindow.webContents.send("paper-window-created", windowState);
    }

    return windowId;
  });

  ipcMain.handle("close-paper-window", (_, windowId: string) => {
    const paperWindow = paperWindows.get(windowId);
    if (paperWindow && !paperWindow.isDestroyed()) {
      paperWindow.close();
    }
  });

  ipcMain.handle("focus-paper-window", (_, windowId: string) => {
    const paperWindow = paperWindows.get(windowId);
    if (paperWindow && !paperWindow.isDestroyed()) {
      paperWindow.focus();
    }
  });

  ipcMain.handle("get-windows-state", () => {
    const states: PaperWindowState[] = [];
    paperWindows.forEach((window, id) => {
      if (!window.isDestroyed()) {
        states.push({
          id,
          windowId: window.id,
          title: window.getTitle(),
          bounds: window.getBounds(),
          opacity: window.getOpacity(),
          clickThrough: window.isAlwaysOnTop(),
          isActive: window.isFocused(),
        });
      }
    });
    return states;
  });

  ipcMain.on("renderer-event", (_, event: string, payload: any) => {
    const windowId = payload.windowId;
    const paperWindow = windowId ? paperWindows.get(windowId) : null;

    if (!controllerWindow) return;

    switch (event) {
      case "set-opacity":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.webContents.send(event, payload);
        }
        break;
      case "toggle-clickthrough":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.setIgnoreMouseEvents(payload.toggle);
          paperWindow.setAlwaysOnTop(payload.toggle);
        }
        break;
      case "set-bounds":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.setBounds(payload);
        }
        break;
      case "set-position":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.setBounds(payload);
        }
        break;
      case "move-position":
        if (paperWindow && !paperWindow.isDestroyed()) {
          const bounds = paperWindow.getBounds();
          paperWindow.setBounds({
            ...bounds,
            x: bounds.x + payload.x,
            y: bounds.y + payload.y,
          });
        }
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

        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.center();
          paperWindow.show();
          paperWindow.webContents.send(event, payload);
        }

        controllerWindow.webContents?.send("goto-controller", { windowId });
        break;
      case "set-image-size":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.setSize(payload.width, payload.height);
          controllerWindow.webContents.send("window-rectangle", {
            windowId,
            x: paperWindow.getBounds().x,
            y: paperWindow.getBounds().y,
            width: payload.width,
            height: payload.height,
            original: true,
          });
        }
        break;
      case "reset-image":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.hide();
        }
        break;
      case "link-aspect":
        if (paperWindow && !paperWindow.isDestroyed()) {
          const { link, ratio } = payload;
          if (link) {
            paperWindow.setAspectRatio(ratio);
          } else {
            paperWindow.setAspectRatio(0);
          }
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
