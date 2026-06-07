export {};

import type { PaperWindowState } from "../../shared/types/window";
import type { IpcRendererEvent } from "electron";

type EventMap = {
  "set-opacity": {
    opacity: number;
  };
  "set-image": {
    type: "data" | "file" | "clipboard";
    data: string;
    filename?: string;
    windowId?: string;
  };
  "window-rectangle": {
    windowId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    original: boolean;
  };
  "paper-window-created": PaperWindowState;
  "paper-window-closed": string; // windowId
  "paper-window-focused": string; // windowId
  "init-paper-window": {
    windowId: string;
  };
  "paper-window-image-updated": {
    windowId: string;
    width: number;
    height: number;
    filename?: string;
  };
};

declare global {
  interface Window {
    // Expose some Api through preload script
    ipc: {
      send: (event: string, payload?: any) => void;
      on: <K extends keyof EventMap>(
        event: K,
        callback: (event: IpcRendererEvent, payload: EventMap[K]) => void
      ) => () => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    removeLoading: () => void;
  }
}
