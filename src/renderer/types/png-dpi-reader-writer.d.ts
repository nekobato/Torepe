declare module 'png-dpi-reader-writer' {
  export function parsePngFormat(buffer: Buffer): {
    width: number;
    height: number;
    dpi: number;
  };
}
