declare module "png-dpi-reader-writer" {
  export function parsePngFormat(arrayBuffer: ArrayBuffer): {
    width?: number;
    height?: number;
    dpi?: number;
  };
}
