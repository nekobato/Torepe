<template>
  <div class="paper" :style="paperStyle">
    <img class="image" :src="state.src" ref="image" @load="onLoad" />
    <div class="overlayer" />
  </div>
</template>

<script lang="ts" setup>
import { parsePngFormat } from "png-dpi-reader-writer";
import { computed, onBeforeUnmount, onMounted, reactive } from "vue";

const state = reactive({
  src: "",
  opacity: 100,
  windowId: "",
});

const dataUrlToArrayBuffer = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const paperStyle = computed(() => {
  return {
    opacity: state.opacity / 100,
  };
});

const setOpacity = (opacity: number) => {
  state.opacity = opacity;
};
const onLoad = (e: Event) => {
  const imageElement = e.currentTarget as HTMLImageElement;

  if (!state.windowId) {
    return;
  }

  let logicalWidth = imageElement.naturalWidth;
  let logicalHeight = imageElement.naturalHeight;

  try {
    const arrayBuffer = dataUrlToArrayBuffer(state.src);
    const buffer = Buffer.from(arrayBuffer);
    const { width, height, dpi } = parsePngFormat(buffer);
    const scale = dpi && dpi > 0 ? dpi / 72 : 1;

    if (width && height && scale > 0) {
      logicalWidth = Math.round(width / scale) || logicalWidth;
      logicalHeight = Math.round(height / scale) || logicalHeight;
    }
  } catch (error) {
    // Non-PNG images or parsing issues fall back to natural dimensions
    logicalWidth = imageElement.naturalWidth;
    logicalHeight = imageElement.naturalHeight;
  }

  window.ipc.send("set-image-size", {
    windowId: state.windowId,
    width: logicalWidth,
    height: logicalHeight,
  });
  const aspectRatio =
    logicalHeight !== 0 ? logicalWidth / logicalHeight : 1;
  window.ipc.send("link-aspect", {
    link: true,
    ratio: aspectRatio,
    windowId: state.windowId,
  });
};

const onKeyPress = (e: KeyboardEvent) => {
  e.preventDefault();
  if (!state.windowId) return;
  switch (e.key) {
    case "ArrowUp":
      window.ipc.send("move-position", { x: 0, y: -1, windowId: state.windowId });
      break;
    case "ArrowDown":
      window.ipc.send("move-position", { x: 0, y: 1, windowId: state.windowId });
      break;
    case "ArrowLeft":
      window.ipc.send("move-position", { x: -1, y: 0, windowId: state.windowId });
      break;
    case "ArrowRight":
      window.ipc.send("move-position", { x: 1, y: 0, windowId: state.windowId });
      break;
    default:
      break;
  }
};

window.ipc.on("set-opacity", (_, payload) => {
  setOpacity(payload.opacity);
});
window.ipc.on("set-image", (_, payload) => {
  state.windowId = payload.windowId ?? state.windowId;
  state.src = payload.data;
});

window.ipc.on("init-paper-window", (_, payload) => {
  state.windowId = payload.windowId;
});

onMounted(() => {
  document.addEventListener("keydown", onKeyPress);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyPress);
});
</script>

<style lang="scss" scoped>
.paper {
  position: relative;
  height: 100%;
  overflow: hidden;
  .overlayer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-app-region: drag;
    cursor: grab;
  }
}
.image {
  width: 100%;
  height: 100%;
}
</style>
