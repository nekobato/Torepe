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
import { initSentry } from "./sentry";
import { pageRoot, preload } from "./static";
import type { PaperWindowState } from "../shared/types/window";
const isDevelopment = process.env.NODE_ENV === "development";

initSentry();

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
const paperWindowClickThrough = new Map<string, boolean>();
let windowIdCounter = 0;

/**
 * Generates a stable application-level paper window ID.
 */
function generateWindowId(): string {
  return `window-${++windowIdCounter}`;
}

/**
 * Returns a user-facing title for the controller tab that owns a paper window.
 */
function getPaperWindowTitle(windowId: string): string {
  const generatedWindowIndex = windowId.match(/^window-(\d+)$/)?.[1];
  return generatedWindowIndex
    ? `Window ${generatedWindowIndex}`
    : `Window ${windowId.replace(/^tab-/, "")}`;
}

/**
 * Sends an IPC event to the controller window if it is still available.
 */
function sendToController(channel: string, payload: unknown): void {
  if (!controllerWindow || controllerWindow.isDestroyed()) return;
  controllerWindow.webContents.send(channel, payload);
}

/**
 * Loads the paper view for a BrowserWindow.
 */
function loadPaperWindow(paperWindow: BrowserWindow): void {
  if (isDevelopment) {
    paperWindow.loadURL(pageRoot + "#/paper");
    paperWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    paperWindow.loadFile(pageRoot, { hash: "/paper" });
  }
}

/**
 * Builds the renderer-facing state object for a paper window.
 */
function toPaperWindowState(
  windowId: string,
  paperWindow: BrowserWindow
): PaperWindowState {
  return {
    id: windowId,
    windowId: paperWindow.id,
    title: getPaperWindowTitle(windowId),
    bounds: paperWindow.getBounds(),
    opacity: paperWindow.getOpacity(),
    clickThrough: paperWindowClickThrough.get(windowId) ?? false,
    isActive: paperWindow.isFocused(),
  };
}

/**
 * Registers lifecycle and geometry notifications for a paper window.
 */
function registerPaperWindowEvents(
  windowId: string,
  paperWindow: BrowserWindow
): void {
  paperWindow.on("closed", () => {
    paperWindows.delete(windowId);
    paperWindowClickThrough.delete(windowId);
    sendToController("paper-window-closed", windowId);
  });

  paperWindow.on("focus", () => {
    sendToController("paper-window-focused", windowId);
  });

  paperWindow.on("moved", () => {
    if (paperWindow.isDestroyed()) return;
    sendToController("window-rectangle", {
      windowId,
      ...paperWindow.getBounds(),
      original: false,
    });
  });

  paperWindow.on("will-resize", (_, rectangle) => {
    sendToController("window-rectangle", {
      windowId,
      ...rectangle,
      original: false,
    });
  });
}

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

checkUpdate();

const menu = Menu.buildFromTemplate([{ role: "appMenu" }]);
Menu.setApplicationMenu(menu);

/**
 * Creates, registers, and loads a transparent paper window.
 */
function createPaperWindow(windowId = generateWindowId()): string {
  const existingPaperWindow = paperWindows.get(windowId);
  if (existingPaperWindow && !existingPaperWindow.isDestroyed()) {
    return windowId;
  }

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
    alwaysOnTop: false,
    show: false,
  });

  paperWindows.set(windowId, paperWindow);
  paperWindowClickThrough.set(windowId, false);

  paperWindow.webContents.once("did-finish-load", () => {
    if (paperWindow.isDestroyed()) return;
    paperWindow.webContents.send("init-paper-window", { windowId });
  });

  loadPaperWindow(paperWindow);
  registerPaperWindowEvents(windowId, paperWindow);

  // Notify controller about new window
  sendToController(
    "paper-window-created",
    toPaperWindowState(windowId, paperWindow)
  );

  return windowId;
}

function createWindow() {
  const controllerWindowWidth = 400;
  const controllerWindowHeight = 320;

  controllerWindow = new BrowserWindow({
    title: "Torepe",
    width: controllerWindowWidth,
    height: controllerWindowHeight,
    minWidth: controllerWindowWidth,
    minHeight: controllerWindowHeight,
    maxHeight: controllerWindowHeight,
    resizable: true,
    webPreferences: {
      preload: preload,
    },
  });

  // Don't create paper window automatically - let controller create it

  if (isDevelopment) {
    controllerWindow.loadURL(pageRoot);
    controllerWindow.webContents.openDevTools({ mode: "detach" });
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
    return createPaperWindow(windowId);
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
        states.push(toPaperWindowState(id, window));
      }
    });
    return states;
  });

  ipcMain.on("renderer-event", (_, event: string, payload: any) => {
    const windowId =
      typeof payload?.windowId === "string" ? payload.windowId : undefined;
    const paperWindow = windowId ? paperWindows.get(windowId) : null;

    if (!controllerWindow) return;

    switch (event) {
      case "set-opacity":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.webContents.send(event, payload);
        }
        break;
      case "toggle-clickthrough":
        if (windowId && paperWindow && !paperWindow.isDestroyed()) {
          const clickThrough = Boolean(payload.toggle);
          paperWindow.setIgnoreMouseEvents(clickThrough);
          paperWindow.setAlwaysOnTop(clickThrough);
          paperWindowClickThrough.set(windowId, clickThrough);
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
      case "set-image": {
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
          payload.filename = payload.filename ?? "Clipboard image";
        }

        if (!paperWindow || paperWindow.isDestroyed()) {
          break;
        }

        payload.windowId = windowId;

        const sendToPaperWindow = () => {
          if (paperWindow.isDestroyed()) return;
          paperWindow.center();
          paperWindow.show();
          paperWindow.webContents.send(event, payload);
        };

        if (paperWindow.webContents.isLoading()) {
          paperWindow.webContents.once("did-finish-load", sendToPaperWindow);
        } else {
          sendToPaperWindow();
        }

        break;
      }
      case "set-image-size":
        if (paperWindow && !paperWindow.isDestroyed()) {
          paperWindow.setSize(payload.width, payload.height);
          if (controllerWindow && !controllerWindow.isDestroyed()) {
            controllerWindow.webContents.send("paper-window-image-updated", {
              windowId,
              width: payload.width,
              height: payload.height,
              filename: payload.filename,
            });
            controllerWindow.webContents.send("window-rectangle", {
              windowId,
              x: paperWindow.getBounds().x,
              y: paperWindow.getBounds().y,
              width: payload.width,
              height: payload.height,
              original: true,
            });
          }
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
        break;
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
