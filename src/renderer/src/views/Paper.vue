<script lang="ts" setup>
import { parsePngFormat } from "png-dpi-reader-writer";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Icon } from "@iconify/vue";

const state = reactive({ src: "", opacity: 100 });
const image = ref<HTMLImageElement | null>(null);
const isControllerVisible = ref(false);

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

  const arrayBuffer = dataUrlToArrayBuffer(state.src);
  const { width, height, dpi } = parsePngFormat(arrayBuffer);

  const per = dpi ? dpi / 72 : window.devicePixelRatio;

  const size = {
    width: Math.round(width / per) || imageElement.naturalWidth,
    height: Math.round(height / per) || imageElement.naturalHeight,
  };

  window.ipc.send("set-image-size", size);
  window.ipc.send("link-aspect", {
    link: true,
    ratio: size.width / size.height,
  });
};

const onKeyPress = (e: KeyboardEvent) => {
  e.preventDefault();
  switch (e.key) {
    case "ArrowUp":
      window.ipc.send("move-position", { x: 0, y: -1 });
      break;
    case "ArrowDown":
      window.ipc.send("move-position", { x: 0, y: 1 });
      break;
    case "ArrowLeft":
      window.ipc.send("move-position", { x: -1, y: 0 });
      break;
    case "ArrowRight":
      window.ipc.send("move-position", { x: 1, y: 0 });
      break;
    default:
      break;
  }
};

const onMouseEnter = () => {
  isControllerVisible.value = true;
};

const onMouseLeave = () => {
  isControllerVisible.value = false;
};

window.ipc.on("set-opacity", (_, payload) => {
  setOpacity(payload.opacity);
});
window.ipc.on("set-image", (_, payload) => {
  state.src = payload.data;
});

onMounted(() => {
  document.addEventListener("keydown", onKeyPress);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeyPress);
});

const closeWindow = () => {
  window.ipc.send("close");
};
</script>
<template>
  <div
    class="paper"
    :style="paperStyle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <img class="image" :src="state.src" ref="image" @load="onLoad" />
    <div class="overlayer" />
    <div
      class="controller"
      :class="{ visible: isControllerVisible }"
      @click.stop
    >
      <button class="mini-button" @click="closeWindow">
        <Icon class="icon" icon="mingcute:close-fill" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.paper {
  position: relative;
  height: 100%;
  overflow: hidden;
  .overlayer {
    margin: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 70%;
    height: 70%;
    user-select: none;
    -webkit-app-region: drag;
    cursor: grab;
  }
}
.image {
  width: 100%;
  height: 100%;
}
.controller {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: auto;
  background-color: rgba(0, 0, 0, 0.72);
  border-radius: 4px;
  -webkit-app-region: no-drag;
  visibility: hidden;

  &.visible {
    visibility: visible;
  }
}
.mini-button {
  width: 20px;
  height: 20px;
  cursor: pointer;
  padding: 2px;

  .icon {
    color: #e5e5e5;
    width: 16px;
    height: 16px;
  }
}
</style>
