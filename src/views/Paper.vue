<template>
  <div class="paper" :style="paperStyle">
    <img class="image" :src="src" ref="image" @load="onLoad" />
    <div class="overlayer" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcOn, ipcSend } from '@/lib/ipc';

const paper = Vue.extend({
  name: 'paper',
  data() {
    return { src: '', opacity: 100 };
  },
  computed: {
    paperStyle() {
      return {
        opacity: this.$data.opacity / 100,
      };
    },
  },
  methods: {
    setOpacity(opacity: number) {
      this.$data.opacity = opacity;
    },
    setImage(payload: any) {
      this.src = payload.data;
    },
    onLoad() {
      const image = this.$refs.image as HTMLImageElement;

      ipcSend('set-image-size', {
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    },
  },
  mounted() {
    ipcOn('set-opacity', (e, payload) => {
      this.setOpacity(payload.opacity);
    });
    ipcOn('set-image', (e, payload) => {
      if (payload.type === 'data') {
        this.setImage(payload);
      } else if (payload.type === 'clipboard') {
        this.setImage(payload);
      }
    });
  },
});

export default paper;
</script>

<style lang="postcss" scoped>
.paper {
  position: relative;
  height: 100%;
  .image {
    width: 100%;
    height: 100%;
  }
  .overlayer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    -webkit-user-select: none;
    -webkit-app-region: drag;
  }
}
</style>
