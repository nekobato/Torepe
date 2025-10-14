export {};

import type { PaperWindowState } from "../../shared/types/window";

type EventMap = {
  "set-opacity": {
    opacity: number;
  };
  "set-image": {
    type: "file" | "clipboard";
    data: string;
    windowId?: string;
  };
  "goto-controller": {
    windowId: string;
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
  };
};

declare global {
  interface Window {
    // Expose some Api through preload script
    ipc: {
      send: (event: string, payload?: any) => void;
      on: <K extends keyof EventMap>(
        event: K,
        callback: (event: K, payload: EventMap[K]) => void
      ) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      removeAllListeners: (channel: string) => void;
    };
    removeLoading: () => void;
  }
}
