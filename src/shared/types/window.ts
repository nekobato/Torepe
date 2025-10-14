export interface PaperWindowState {
  id: string;
  windowId: number; // Electron BrowserWindow ID
  title: string;
  imageData?: {
    path?: string;
    dataUrl?: string;
    width: number;
    height: number;
  };
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  opacity: number;
  clickThrough: boolean;
  isActive: boolean;
}

export interface WindowsStore {
  windows: Map<string, PaperWindowState>;
  activeWindowId: string | null;
}

export interface WindowEvent {
  windowId: string;
  type: "focus" | "blur" | "close" | "move" | "resize";
  payload?: any;
}
