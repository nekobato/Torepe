import { BrowserWindow, app } from "electron";
import { isDevelopment, pageRoot, preload } from "./static";

export const createWindow = () => {
  const controllerWindow = new BrowserWindow({
    width: 240,
    height: 240,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload,
    },
  });

  controllerWindow.on("closed", () => {
    app.quit();
  });

  if (isDevelopment) {
    controllerWindow.loadURL(pageRoot + "#/dropper");
    controllerWindow.webContents.openDevTools();
  } else {
    controllerWindow.loadFile(pageRoot, { hash: "/dropper" });
  }

  return controllerWindow;
};
