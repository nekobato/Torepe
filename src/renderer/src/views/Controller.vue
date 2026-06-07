<script lang="ts" setup>
import { reactive, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import Button from "primevue/button";
import Slider from "primevue/slider";
import InputNumber from "primevue/inputnumber";
import { useWindowsStore } from "../stores/windows";
import type { PaperWindowState } from "../../../shared/types/window";

interface Props {
  windowId: string;
  windowData: PaperWindowState;
}

const props = defineProps<Props>();
const windowsStore = useWindowsStore();
let unsubscribeWindowRectangle: (() => void) | undefined;

const state = reactive({
  clickThrough: false,
  opacity: 100,
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
  aspectLink: true,
});

const toggleClickThrough = () => {
  const nextClickThrough = !state.clickThrough;
  window.ipc.send("toggle-clickthrough", {
    toggle: nextClickThrough,
    windowId: props.windowId,
  });
  state.clickThrough = nextClickThrough;
  windowsStore.updateWindow(props.windowId, { clickThrough: nextClickThrough });
};
const onChangeWidth = (newWidth?: number) => {
  if (state.aspectLink) {
    state.windowSize.height = Math.round(
      Number(newWidth) / (state.windowSize.width / state.windowSize.height)
    );
    state.windowSize.width = Number(newWidth);
  } else {
    state.windowSize.width = Number(newWidth);
  }

  window.ipc.send("set-bounds", {
    width: Number(state.windowSize.width),
    height: Number(state.windowSize.height),
    windowId: props.windowId,
  });
};
const onChangeHeight = (newHeight?: number) => {
  if (state.aspectLink) {
    state.windowSize.width = Math.round(
      Number(newHeight) * (state.windowSize.width / state.windowSize.height)
    );
  }
  state.windowSize.height = Number(newHeight);

  window.ipc.send("set-bounds", {
    width: Number(state.windowSize.width),
    height: Number(state.windowSize.height),
    windowId: props.windowId,
  });
};

const linkAspect = () => {
  state.aspectLink = !state.aspectLink;
  window.ipc.send("link-aspect", {
    link: state.aspectLink,
    ratio: state.windowSize.width / state.windowSize.height,
    windowId: props.windowId,
  });
};

watch(
  () => state.opacity,
  (newOpacity) => {
    window.ipc.send("set-opacity", {
      opacity: newOpacity,
      windowId: props.windowId,
    });
    windowsStore.updateWindow(props.windowId, { opacity: newOpacity / 100 });
  }
);

const handleWindowRectangle = (event: any, payload: any) => {
  if (payload.windowId === props.windowId) {
    const { x, y, width, height, original } = payload;
    state.windowPosition = { x, y };
    state.windowSize = { width, height };
    if (original) {
      state.imageSize = { width, height };
    }

    const existing = windowsStore.getWindow(props.windowId);
    windowsStore.updateWindow(props.windowId, {
      bounds: {
        x,
        y,
        width,
        height,
      },
      imageData: original
        ? {
            ...(existing?.imageData ?? {}),
            width,
            height,
          }
        : existing?.imageData,
    });
  }
};

onMounted(() => {
  // Initialize state from window data
  if (props.windowData) {
    state.windowPosition = {
      x: props.windowData.bounds.x,
      y: props.windowData.bounds.y,
    };
    state.windowSize = {
      width: props.windowData.bounds.width,
      height: props.windowData.bounds.height,
    };
    state.opacity = props.windowData.opacity * 100;
    state.clickThrough = props.windowData.clickThrough;

    if (props.windowData.imageData) {
      state.imageSize = {
        width: props.windowData.imageData.width,
        height: props.windowData.imageData.height,
      };
    }
  }

  unsubscribeWindowRectangle = window.ipc.on(
    "window-rectangle",
    handleWindowRectangle
  );
});

onUnmounted(() => {
  unsubscribeWindowRectangle?.();
  unsubscribeWindowRectangle = undefined;
});
</script>
<template>
  <div class="controller">
    <div class="original-size-container">
      <span class="label">Original</span>
      <span class="size"
        >{{ state.imageSize.width }} x {{ state.imageSize.height }}</span
      >
    </div>
    <div class="size-fields">
      <div class="form-item">
        <label>Width</label>
        <InputNumber
          v-model="state.windowSize.width"
          :min="1"
          size="small"
          class="input"
          @update:model-value="onChangeWidth"
        />
      </div>
      <div class="form-item">
        <label>Height</label>
        <InputNumber
          v-model="state.windowSize.height"
          :min="1"
          size="small"
          class="input"
          @update:model-value="onChangeHeight"
        />
      </div>
      <Button
        class="link-aspect-button"
        @click="linkAspect"
        text
        size="small"
        rounded
      >
        <Icon
          icon="mingcute:link-2-line"
          class="link-aspect-icon"
          v-if="state.aspectLink"
        />
        <Icon icon="mingcute:unlink-2-line" class="link-aspect-icon" v-else />
      </Button>
    </div>
    <div class="opacity">
      <label>Opacity</label>
      <Slider
        v-model="state.opacity"
        :min="1"
        :max="100"
        class="opacity-slider"
      />
    </div>
    <div class="clickthrough">
      <Button
        class="clickthrough-button"
        :class="{
          on: state.clickThrough,
          off: !state.clickThrough,
        }"
        @click="toggleClickThrough"
        text
      >
        <Icon
          icon="mingcute:ghost-fill"
          class="icon"
          v-if="state.clickThrough"
        />
        <Icon icon="mingcute:ghost-line" class="icon" v-else />
        <span>IgnoreMouse is</span>
        <span class="state on" v-if="state.clickThrough">ON</span>
        <span class="state off" v-else>OFF</span>
      </Button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.controller {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 240px;
  height: 100%;
  gap: 16px;
  padding: 16px;
}
.size-fields {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: flex-end;

  .form-item {
    flex-grow: 1;
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    label {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .input {
      width: 100%;
    }
    :deep(.p-inputnumber-input) {
      width: 100%;
    }
  }

  .link-aspect-button {
    flex-shrink: 0;
    .link-aspect-icon {
      width: 20px;
      height: 20px;
    }
  }
}
.original-size-container {
  flex-shrink: 0;
  display: flex;
  width: 100%;
  flex-direction: column;
  .label {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .size {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1;
    color: #ffffff;
  }
}
.reset {
  position: absolute;
  top: 8px;
  left: 8px;
  .icon + * {
    margin-left: 4px;
  }
}
.clickthrough {
  margin-top: 16px;
  width: 100%;
  .clickthrough-button {
    width: 100%;
    .icon {
      width: 20px;
      height: 20px;

      & + * {
        margin-left: 4px;
      }
    }

    &.on {
      .icon {
        color: #f56c6c;
      }
    }

    &.off {
      .icon {
        color: #67c23a;
      }
    }
  }
  .state {
    display: inline-block;
    margin-left: 4px;
    width: 24px;
    font-weight: bold;

    &.on {
      color: #f56c6c;
    }

    &.off {
      color: #67c23a;
    }
  }
}
.opacity {
  width: 100%;
  label {
    position: relative;
    top: -8px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
}
</style>
