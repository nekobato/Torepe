<script lang="ts" setup>
import { reactive } from "vue";

const emit = defineEmits<{
  (e: "change", opacity: number): void;
}>();

const state = reactive({
  opacity: 100,
});
const onChange = () => {
  emit("change", Number(state.opacity));
};
</script>
<template>
  <div class="opacity">
    <span class="background-text">OPACITY</span>
    <input
      class="opacity-range"
      type="range"
      from="0"
      to="100"
      v-model="state.opacity"
      @change="onChange"
    />
    <span class="opacity-value">{{ state.opacity }}</span>
  </div>
</template>
<style lang="scss" scoped>
.opacity {
  --height: 44px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--height);
  .background-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: auto;
    font-size: 24px;
    line-height: var(--height);
    color: hsl(0, 0%, 60%);
  }
  .opacity-range {
    position: relative;
    text-align: center;
    -webkit-appearance: none;
    background-color: #999;
    margin: auto 0;
    height: 3px;
    width: 100%;
    border-radius: 2px;
    opacity: 0.8;
    z-index: 1;
    &:focus,
    &:active {
      outline: none;
    }
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      cursor: pointer;
      position: relative;
      border: 2px solid rgba(0, 0, 0, 0.6);
      width: 20px;
      height: 20px;
      display: block;
      background-color: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
    }
    &:active::-webkit-slider-thumb {
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.6);
      transition: 0.4s;
    }
    &:hover {
      &::-webkit-slider-thumb {
        background-color: rgba(255, 255, 255, 0.7);
      }
    }
  }
  .opacity-value {
    position: absolute;
    right: 0;
    bottom: 0;
    text-align: right;
    font-size: 12px;
    line-height: 1;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>
