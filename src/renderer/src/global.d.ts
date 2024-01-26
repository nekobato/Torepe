export {};

type EventMap = {
  'set-opacity': {
    opacity: number;
  };
  'set-image': {
    type: 'file' | 'clipboard';
    data: string;
  };
  'goto-controller': void;
  'window-rectangle': {
    x: number;
    y: number;
    width: number;
    height: number;
    original: boolean;
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
    };
    removeLoading: () => void;
  }
}
