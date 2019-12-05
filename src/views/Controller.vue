<template>
  <div class="controller">
    <div class="transition">
      <button class="arrow up" @click="moveUp">
        <ArrowUp class="icon" />
      </button>
      <button class="arrow left" @click="moveLeft">
        <ArrowLeft class="icon" />
      </button>
      <button class="arrow right" @click="moveRight">
        <ArrowRight class="icon" />
      </button>
      <button class="arrow down" @click="moveDown">
        <ArrowDown class="icon" />
      </button>
      <div class="field-container x">
        <span class="label">X</span>
        <input
          class="field"
          type="number"
          v-model="windowPosition.x"
          disabled
        />
      </div>
      <div class="field-container y">
        <span class="label">Y</span>
        <input
          class="field"
          type="number"
          v-model="windowPosition.y"
          disabled
        />
      </div>
    </div>
    <div class="size-fields">
      <div class="field-container width">
        <span class="label">WIDTH</span>
        <input
          class="field"
          type="number"
          v-model="windowSize.width"
          @change="onChangeSize"
        />
      </div>
      <div class="field-container height">
        <span class="label">HEIGHT</span>
        <input
          class="field"
          type="number"
          v-model="windowSize.height"
          @change="onChangeSize"
        />
      </div>
    </div>
    <ClickthroughToggle
      class="toggle"
      :status="clickThrough"
      @toggle="onToggle"
    />
    <Opacity class="range" @change="onChangeOpacity" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Opacity from '@/components/Opacity.vue';
import ClickthroughToggle from '@/components/ClickthroughToggle.vue';
import ArrowUp from '@/components/Icons/ArrowUp.vue';
import ArrowLeft from '@/components/Icons/ArrowLeft.vue';
import ArrowRight from '@/components/Icons/ArrowRight.vue';
import ArrowDown from '@/components/Icons/ArrowDown.vue';
import { ipcSend, ipcOn } from '@/lib/ipc';

export default Vue.extend({
  name: 'controller',
  components: {
    Opacity,
    ClickthroughToggle,
    ArrowUp,
    ArrowLeft,
    ArrowRight,
    ArrowDown,
  },
  data() {
    return {
      clickThrough: false,
      windowPosition: {
        x: 0,
        y: 0,
      },
      windowSize: {
        width: 0,
        height: 0,
      },
    };
  },
  methods: {
    onToggle() {
      ipcSend('toggle-clickthrough', { toggle: !this.clickThrough });
      this.clickThrough = !this.clickThrough;
    },
    moveUp() {
      this.windowPosition.y -= 1;
      ipcSend('set-position', this.windowPosition);
    },
    moveLeft() {
      this.windowPosition.x -= 1;
      ipcSend('set-position', this.windowPosition);
    },
    moveRight() {
      this.windowPosition.x += 1;
      ipcSend('set-position', this.windowPosition);
    },
    moveDown() {
      this.windowPosition.y += 1;
      ipcSend('set-position', this.windowPosition);
    },
    onChangeSize() {
      ipcSend('set-bounds', {
        width: Number(this.windowSize.width),
        height: Number(this.windowSize.height),
      });
    },
    onChangeOpacity(opacity: number) {
      ipcSend('set-opacity', { opacity: opacity });
    },
  },
  mounted() {
    ipcOn('window-rectangle', (_, { x, y, width, height }) => {
      this.$data.windowPosition = {
        x,
        y,
      };
      this.$data.windowSize = {
        width,
        height,
      };
    });
  },
});
</script>

<style lang="postcss" scoped>
.controller {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  border: 1px solid #ddd;
  .toggle {
    margin-top: 16px;
  }
  .range {
    margin-top: 8px;
    width: 160px;
    text-align: center;
  }
  .field {
    padding: 2px 4px;
    width: 56px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    line-height: 24px;
    text-align: right;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
    }
  }
  .transition {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 160px;
    height: 160px;
    .field-container.y {
      margin-top: 16px;
    }
    .arrow {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #ddd;
      border-radius: 4px;
      cursor: pointer;
      &:hover {
        .icon {
          .fill: rgba(0, 0, 0, 0.7);
        }
      }
      &:active {
        .icon {
          fill: hsla(220, 30%, 50%, 0.7);
        }
      }
    }
    .up {
      top: 16px;
    }
    .left {
      left: 16px;
    }
    .right {
      right: 16px;
    }
    .down {
      bottom: 16px;
    }
  }
  .field-container {
    position: relative;
    .label {
      position: absolute;
      top: -12px;
      left: 0;
      line-height: 1;
      font-size: 12px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.4);
    }
  }
  .size-fields {
    position: relative;
    display: flex;
    justify-content: center;
    .field-container.height {
      margin-left: 8px;
    }
  }
}
</style>
