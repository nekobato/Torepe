import { clipboard, nativeImage } from "electron";

export async function readClipboardImage() {
  for (const item of await clipboard.read()) {
    const mimeType = ["image/png", "image/jpeg"].find((type) =>
      item.types.includes(type)
    );
    if (!mimeType) continue;

    const data = await item.getType(mimeType);
    if (!(data instanceof Blob)) continue;

    const image = nativeImage.createFromBuffer(
      Buffer.from(await data.arrayBuffer())
    );
    if (!image.isEmpty()) return image;
  }

  return nativeImage.createEmpty();
}
