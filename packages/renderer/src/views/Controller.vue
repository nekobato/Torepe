<script lang="ts" setup>
import Opacity from '@/components/Opacity.vue';
import ClickthroughToggle from '@/components/ClickthroughToggle.vue';
import ArrowUp from '@/components/Icons/ArrowUp.vue';
import ArrowLeft from '@/components/Icons/ArrowLeft.vue';
import ArrowRight from '@/components/Icons/ArrowRight.vue';
import ArrowDown from '@/components/Icons/ArrowDown.vue';
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const state = reactive({
  clickThrough: false,
  windowPosition: {
    x: 0,
    y: 0,
  },
  windowSize: {
    width: 0,
    height: 0,
  },
});

const onToggle = () => {
  window.ipc.send('toggle-clickthrough', { toggle: !state.clickThrough });
  state.clickThrough = !state.clickThrough;
};
const moveUp = () => {
  state.windowPosition.y -= 1;
  window.ipc.send('set-position', state.windowPosition);
};
const moveLeft = () => {
  state.windowPosition.x -= 1;
  window.ipc.send('set-position', state.windowPosition);
};
const moveRight = () => {
  state.windowPosition.x += 1;
  window.ipc.send('set-position', state.windowPosition);
};
const moveDown = () => {
  state.windowPosition.y += 1;
  window.ipc.send('set-position', state.windowPosition);
};
const onChangeSize = () => {
  window.ipc.send('set-bounds', {
    width: Number(state.windowSize.width),
    height: Number(state.windowSize.height),
  });
};
const onChangeOpacity = (opacity: number) => {
  window.ipc.send('set-opacity', {
    opacity,
  });
};
const resetImage = () => {
  window.ipc.send('reset-image');
  router.push('/dropper');
};

onMounted(() => {
  window.ipc.on('window-rectangle', (_, { x, y, width, height }) => {
    state.windowPosition = {
      x,
      y,
    };
    state.windowSize = {
      width,
      height,
    };
  });
});
</script>
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
          v-model="state.windowPosition.x"
          disabled
        />
      </div>
      <div class="field-container y">
        <span class="label">Y</span>
        <input
          class="field"
          type="number"
          v-model="state.windowPosition.y"
          disabled
        />
      </div>
    </div>
    <div class="original-size-container">
      <span class="label">ORIGINAL SIZE</span>
      <span class="size"
        >{{ state.windowSize.width }} x {{ state.windowSize.height }}</span
      >
    </div>
    <div class="size-fields">
      <div class="field-container width">
        <span class="label">WIDTH</span>
        <input
          class="field"
          type="number"
          v-model="state.windowSize.width"
          @change="onChangeSize"
        />
      </div>
      <div class="field-container height">
        <span class="label">HEIGHT</span>
        <input
          class="field"
          type="number"
          v-model="state.windowSize.height"
          @change="onChangeSize"
        />
      </div>
    </div>
    <ClickthroughToggle
      class="toggle"
      :status="state.clickThrough"
      @toggle="onToggle"
    />
    <Opacity class="range" @change="onChangeOpacity" />
    <button class="reset" @click="resetImage">Reset</button>
  </div>
</template>

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
          fill: rgba(0, 0, 0, 0.7);
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
    margin-top: 8px;
    position: relative;
    display: flex;
    justify-content: center;
    .field-container.height {
      margin-left: 8px;
    }
  }
  .reset {
    margin-top: 24px;
    margin-left: 0;
    border: 2px solid #cccccc;
    background: transparent;
    color: #666666;
    width: 120px;
    height: 32px;
    border-radius: 20px;
    text-transform: uppercase;
    font-weight: bold;
    &:hover {
      border-color: #404040;
      color: #4c4c4c;
    }
    &:active {
      border-color: #222222;
      color: #999999;
    }
  }
}
.original-size-container {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 48px;
  .label {
    font-size: 12px;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.4);
  }
  .size {
    margin-top: 4px;
    font-size: 16px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.7);
  }
}
</style>
