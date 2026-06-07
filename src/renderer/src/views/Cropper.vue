<script lang="ts" setup>
import { computed, reactive } from "vue";

const getRect = (
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const leftTop = {
    x: start.x < end.x ? start.x : end.x,
    y: start.y < end.y ? start.y : end.y,
  };

  return {
    x: leftTop.x,
    y: leftTop.y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
};

const state = reactive({
  isCropping: false,
  start: {
    x: 0,
    y: 0,
  },
  end: {
    x: 0,
    y: 0,
  },
});

const rectStyle = computed(() => {
  const rect = getRect(state.start, state.end);
  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.x}px`,
    height: `${rect.y}px`,
  };
});

const onMouseDown = (e: MouseEvent) => {
  state.isCropping = true;
  state.start = {
    x: e.clientX,
    y: e.clientY,
  };
  state.end = {
    x: e.clientX,
    y: e.clientY,
  };
};
const onMouseup = (e: MouseEvent) => {
  state.isCropping = false;
  window.ipc.send("set-rect", getRect(state.start, state.end));
};
const onMouseMove = (e: MouseEvent) => {
  if (!state.isCropping) return;
  state.end = {
    x: e.clientX,
    y: e.clientY,
  };
};
</script>

<template>
  <div
    class="cropper"
    @mousedown="onMouseDown"
    @mouseup="onMouseup"
    @mousemove="onMouseMove"
  >
    <div class="rect" :style="rectStyle" v-show="state.isCropping" />
  </div>
</template>

<style lang="scss">
body,
html {
  height: 100%;
}
</style>
<style lang="scss" scoped>
.cropper {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  .rect {
    position: absolute;
    border: 1px solid #ddd;
  }
}
</style>
