import { autoUpdater } from "electron-updater";

export const checkUpdate = () => {
  autoUpdater.checkForUpdatesAndNotify();
  autoUpdater.on('update-available', () => {
    autoUpdater.downloadUpdate();
  });
  return autoUpdater;
};
