<script lang="ts" setup>
import Opacity from '@/components/Opacity.vue';
import ClickthroughToggle from '@/components/ClickthroughToggle.vue';
import ArrowUp from '@/components/Icons/ArrowUp.vue';
import ArrowLeft from '@/components/Icons/ArrowLeft.vue';
import ArrowRight from '@/components/Icons/ArrowRight.vue';
import ArrowDown from '@/components/Icons/ArrowDown.vue';
import { reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

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
  imageSize: {
    width: 0,
    height: 0,
  },
  aspectLink: false,
});

const onToggle = () => {
  window.ipc.send('toggle-clickthrough', { toggle: !state.clickThrough });
  state.clickThrough = !state.clickThrough;
};
const moveWindow = (direction: 'up' | 'left' | 'right' | 'down') => {
  switch (direction) {
    case 'up':
      state.windowPosition.y -= 1;
      break;
    case 'left':
      state.windowPosition.x -= 1;
      break;
    case 'right':
      state.windowPosition.x += 1;
      break;
    case 'down':
      state.windowPosition.y += 1;
      break;
  }
  window.ipc.send('set-position', {
    x: state.windowPosition.x,
    y: state.windowPosition.y,
  });
};
const onChangeWidth = (
  windowSize: { width: number; height: number },
  e: InputEvent
) => {
  const newWidth = (e.target as HTMLInputElement).value;
  if (state.aspectLink) {
    state.windowSize.height = Math.round(
      Number(newWidth) / (windowSize.width / windowSize.height)
    );
    state.windowSize.width = Number(newWidth);
  } else {
    state.windowSize.width = Number(newWidth);
  }

  window.ipc.send('set-bounds', {
    width: Number(state.windowSize.width),
    height: Number(state.windowSize.height),
  });
};
const onChangeHeight = (
  windowSize: { width: number; height: number },
  e: InputEvent
) => {
  const newHeight = (e.target as HTMLInputElement).value;
  if (state.aspectLink) {
    state.windowSize.width = Math.round(
      Number(newHeight) * (windowSize.width / windowSize.height)
    );
    state.windowSize.height = Number(newHeight);
  } else {
    state.windowSize.height = Number(newHeight);
  }

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
const linkAspect = () => {
  state.aspectLink = !state.aspectLink;
  window.ipc.send('link-aspect', {
    link: state.aspectLink,
    ratio: state.windowSize.width / state.windowSize.height,
  });
};

window.ipc.on('window-rectangle', (_, { x, y, width, height, original }) => {
  state.windowPosition = {
    x,
    y,
  };
  state.windowSize = {
    width,
    height,
  };
  if (original) {
    state.imageSize = {
      width,
      height,
    };
  }
});
</script>
<template>
  <div class="controller">
    <button class="reset" @click="resetImage">
      <Icon icon="ion:arrow-back" class="icon" />
    </button>
    <div class="transition">
      <button class="arrow up" @click="moveWindow('up')">
        <ArrowUp class="icon" />
      </button>
      <button class="arrow left" @click="moveWindow('left')">
        <ArrowLeft class="icon" />
      </button>
      <button class="arrow right" @click="moveWindow('right')">
        <ArrowRight class="icon" />
      </button>
      <button class="arrow down" @click="moveWindow('down')">
        <ArrowDown class="icon" />
      </button>
    </div>
    <div class="original-size-container">
      <span class="label">ORIGINAL SIZE</span>
      <span class="size"
        >{{ state.imageSize.width }} x {{ state.imageSize.height }}</span
      >
    </div>
    <div class="size-fields">
      <div class="field-container width">
        <span class="label">WIDTH</span>
        <input
          class="field"
          type="number"
          :value="state.windowSize.width"
          @change="onChangeWidth(state.windowSize, $event)"
        />
      </div>
      <div class="field-container height">
        <span class="label">HEIGHT</span>
        <input
          class="field"
          type="number"
          :value="state.windowSize.height"
          @change="onChangeHeight(state.windowSize, $event)"
        />
      </div>
      <button class="link-aspect-button" @click="linkAspect">
        <Icon
          icon="ion:link"
          class="link-aspect-icon"
          v-if="state.aspectLink"
        />
        <Icon icon="ion:unlink" class="link-aspect-icon" v-else />
      </button>
    </div>
    <ClickthroughToggle
      class="toggle"
      :status="state.clickThrough"
      @toggle="onToggle"
    />
    <Opacity class="range" @change="onChangeOpacity" />
  </div>
</template>

<style lang="scss" scoped>
.controller {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  border: 1px solid #ddd;
  gap: 8px;
  .range {
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
    width: 120px;
    height: 100px;
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
.reset {
  position: absolute;
  top: 4px;
  left: 8px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  margin-left: 0;
  border: 2px solid #cccccc;
  background: transparent;
  color: #666666;
  width: 40px;
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
  .icon {
    width: 20px;
    height: 20px;
  }
}
.link-aspect-button {
  margin-left: 8px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 100%;
  background-color: transparent;
  border-radius: 4px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.2);
  }
  .link-aspect-icon {
    color: rgba(0, 0, 0, 0.4);
    width: 24px;
    height: 24px;
  }
}
</style>
