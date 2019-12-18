import { IpcRendererEvent } from 'electron';

const { ipcRenderer } = process.env.IS_ELECTRON
  ? require('electron')
  : {
      ipcRenderer: {
        send: (..._: any[]) => {},
        on: (..._: any[]) => {},
      },
    };

export const ipcSend = (event: string, payload: any) => {
  ipcRenderer.send('renderer-event', event, payload);
};

export const ipcOn = (
  event: string,
  fn: (event: IpcRendererEvent, ...args: any[]) => void
) => {
  ipcRenderer.on(event, fn);
};
