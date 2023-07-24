export type IpcEventPayload = {
  'set-opacity': number;
  'toggle-clickthrough': boolean;
  'window-rectangle': {
    x: number;
    y: number;
    width: number;
    height: number;
    original: boolean;
  };
};
