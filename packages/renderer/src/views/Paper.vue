<template>
  <div class="paper" :style="paperStyle">
    <img class="image" :src="state.src" ref="image" @load="onLoad" />
    <div class="overlayer" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

const state = reactive({ src: '', opacity: 100 });
const image = ref<HTMLImageElement | null>(null);

const paperStyle = computed(() => {
  return {
    opacity: state.opacity / 100,
  };
});

const setOpacity = (opacity: number) => {
  state.opacity = opacity;
};
const setImage = (payload: any) => {
  state.src = payload.data;
};
const onLoad = () => {
  window.ipc.send('set-image-size', {
    width: image.value?.naturalWidth,
    height: image.value?.naturalHeight,
  });
};

onMounted(() => {
  window.ipc.on('set-opacity', (e, payload) => {
    setOpacity(payload.opacity);
  });
  window.ipc.on('set-image', (e, payload) => {
    if (payload.type === 'data') {
      setImage(payload);
    } else if (payload.type === 'clipboard') {
      setImage(payload);
    }
  });
});
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
