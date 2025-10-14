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
  window.ipc.send("toggle-clickthrough", {
    toggle: !state.clickThrough,
    windowId: props.windowId,
  });
  state.clickThrough = !state.clickThrough;
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

const resetImage = () => {
  window.ipc.send("reset-image", { windowId: props.windowId });
  windowsStore.updateWindow(props.windowId, { imageData: undefined });
};

const closeWindow = () => {
  window.ipc.invoke("close-paper-window", props.windowId);
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

  window.ipc.on("window-rectangle", handleWindowRectangle);
});

onUnmounted(() => {
  window.ipc.removeAllListeners("window-rectangle");
});
</script>
<template>
  <div class="controller">
    <Button
      class="close"
      @click="closeWindow"
      severity="danger"
      size="small"
      text
    >
      <Icon class="icon" icon="mingcute:close-line" />
    </Button>
    <div class="original-size-container">
      <span class="label">画像サイズ</span>
      <span class="size"
        >{{ state.imageSize.width }} x {{ state.imageSize.height }}</span
      >
    </div>
    <div class="size-fields">
      <div class="form-item-group">
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
      </div>
      <Button class="link-aspect-button" @click="linkAspect" text>
        <Icon
          icon="mingcute:link-2-line"
          class="link-aspect-icon"
          v-if="state.aspectLink"
        />
        <Icon icon="mingcute:unlink-2-line" class="link-aspect-icon" v-else />
      </Button>
    </div>
    <div class="opacity">
      <label>OPACITY</label>
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
  height: 100%;
  gap: 8px;
}
.size-fields {
  margin-top: 52px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  .form-item-group {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    gap: 8px;
    .form-item {
      label {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        & + .input {
          margin-left: 4px;
        }
      }
      .input {
        width: 100px;
      }
      :deep(.p-inputnumber-input) {
        width: 100px;
      }
    }
  }

  .link-aspect-button {
    .link-aspect-icon {
      width: 20px;
      height: 20px;
    }
  }
}
.original-size-container {
  position: absolute;
  top: 8px;
  right: 8px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  height: 48px;
  .label {
    font-size: 12px;
    font-weight: bold;
  }
  .size {
    margin-top: 4px;
    font-size: 18px;
    line-height: 1;
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
.close {
  position: absolute;
  top: 8px;
  left: 48px;
  .icon {
    width: 16px;
    height: 16px;
  }
}
.clickthrough {
  .clickthrough-button {
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
  label {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .opacity-slider {
    width: 160px;
  }
  :deep(.p-slider) {
    width: 160px;
  }
}
</style>
