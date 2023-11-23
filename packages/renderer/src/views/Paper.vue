<template>
  <div class="paper" :style="paperStyle">
    <img class="image" :src="state.src" ref="image" @load="onLoad" />
    <div class="overlayer" />
  </div>
</template>

<script lang="ts" setup>
import { parsePngFormat } from 'png-dpi-reader-writer';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

const state = reactive({ src: '', opacity: 100 });
const image = ref<HTMLImageElement | null>(null);

const dataUrlToArrayBuffer = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1];
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

  window.ipc.send('set-image-size', {
    width: Math.round(width / per) || imageElement.naturalWidth,
    height: Math.round(height / per) || imageElement.naturalHeight,
  });
};

const onKeyPress = (e: KeyboardEvent) => {
  e.preventDefault();
  switch (e.key) {
    case 'ArrowUp':
      window.ipc.send('move-position', { x: 0, y: -1 });
      break;
    case 'ArrowDown':
      window.ipc.send('move-position', { x: 0, y: 1 });
      break;
    case 'ArrowLeft':
      window.ipc.send('move-position', { x: -1, y: 0 });
      break;
    case 'ArrowRight':
      window.ipc.send('move-position', { x: 1, y: 0 });
      break;
    default:
      break;
  }
};

window.ipc.on('set-opacity', (_, payload) => {
  setOpacity(payload.opacity);
});
window.ipc.on('set-image', (_, payload) => {
  state.src = payload.data;
});

onMounted(() => {
  document.addEventListener('keydown', onKeyPress);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyPress);
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
