import { BrowserWindow } from "electron";
import { isDevelopment, pageRoot, preload } from "./static";

export const createWindow = () => {
  const paperWindow = new BrowserWindow({
    title: "Torepe",
    frame: false,
    hasShadow: false,
    transparent: true,
    resizable: true,
    roundedCorners: false,
    thickFrame: false,
    webPreferences: {
      preload: preload,
    },
    alwaysOnTop: true,
    show: false,
    fullscreenable: false,
    minimizable: false,
  });

  if (isDevelopment) {
    paperWindow.loadURL(pageRoot + "#/paper");
    paperWindow.webContents.openDevTools();
  } else {
    paperWindow.loadFile(pageRoot, { hash: "/paper" });
  }

  return paperWindow;
};
