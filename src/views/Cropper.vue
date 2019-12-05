<template>
  <div
    class="cropper"
    @mousedown="onMouseDown"
    @mouseup="onMouseup"
    @mousemove="onMouseMove"
  >
    <div class="rect" :style="rectStyle" v-show="isCropping" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcSend } from '../lib/ipc';

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

export default Vue.extend({
  name: 'cropper',
  data() {
    return {
      isCropping: false,
      start: {
        x: 0,
        y: 0,
      },
      end: {
        x: 0,
        y: 0,
      },
    };
  },
  computed: {
    rectStyle() {
      const rect = getRect(this.start, this.end);
      return {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.x}px`,
        height: `${rect.y}px`,
      };
    },
  },
  methods: {
    onMouseDown(e: MouseEvent) {
      this.isCropping = true;
      this.start = {
        x: e.clientX,
        y: e.clientY,
      };
      this.end = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    onMouseup(e: MouseEvent) {
      this.isCropping = false;
      ipcSend('set-rect', getRect(this.start, this.end));
    },
    onMouseMove(e: MouseEvent) {
      if (!this.isCropping) return;
      this.end = {
        x: e.clientX,
        y: e.clientY,
      };
    },
  },
});
</script>
<style lang="postcss">
body,
html {
  height: 100%;
}
</style>
<style lang="postcss" scoped>
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
