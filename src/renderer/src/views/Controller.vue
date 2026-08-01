<script lang="ts" setup>
import { reactive, ref, watch, onMounted, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { ElButton, ElInputNumber, ElSlider } from "element-plus";
import { useWindowsStore } from "../stores/windows";
import type { PaperWindowState } from "../../../shared/types/window";

interface Props {
  windowId: string;
  windowData: PaperWindowState;
}

const props = defineProps<Props>();
const windowsStore = useWindowsStore();
let unsubscribeWindowRectangle: (() => void) | undefined;
const isControllerReady = ref(false);

const state = reactive({
  clickThrough: props.windowData.clickThrough,
  opacity: props.windowData.opacity * 100,
  windowPosition: {
    x: props.windowData.bounds.x,
    y: props.windowData.bounds.y,
  },
  windowSize: {
    width: props.windowData.bounds.width,
    height: props.windowData.bounds.height,
  },
  imageSize: {
    width: props.windowData.imageData?.width ?? 0,
    height: props.windowData.imageData?.height ?? 0,
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
  if (
    !isControllerReady.value ||
    newWidth === undefined ||
    !Number.isFinite(newWidth)
  ) {
    return;
  }

  const oldWidth = state.windowSize.width;
  if (state.aspectLink && oldWidth > 0) {
    state.windowSize.height = Math.round(
      newWidth / (oldWidth / state.windowSize.height)
    );
  }
  state.windowSize.width = newWidth;

  window.ipc.send("set-bounds", {
    width: state.windowSize.width,
    height: state.windowSize.height,
    windowId: props.windowId,
  });
};
const onChangeHeight = (newHeight?: number) => {
  if (
    !isControllerReady.value ||
    newHeight === undefined ||
    !Number.isFinite(newHeight)
  ) {
    return;
  }

  const oldHeight = state.windowSize.height;
  if (state.aspectLink && oldHeight > 0) {
    state.windowSize.width = Math.round(
      newHeight * (state.windowSize.width / oldHeight)
    );
  }
  state.windowSize.height = newHeight;

  window.ipc.send("set-bounds", {
    width: state.windowSize.width,
    height: state.windowSize.height,
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
  unsubscribeWindowRectangle = window.ipc.on(
    "window-rectangle",
    handleWindowRectangle
  );
  isControllerReady.value = true;
});

onUnmounted(() => {
  isControllerReady.value = false;
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
        <ElInputNumber
          :model-value="state.windowSize.width"
          :min="1"
          :controls="false"
          size="small"
          class="input"
          @update:model-value="onChangeWidth"
        />
      </div>
      <div class="form-item">
        <label>Height</label>
        <ElInputNumber
          :model-value="state.windowSize.height"
          :min="1"
          :controls="false"
          size="small"
          class="input"
          @update:model-value="onChangeHeight"
        />
      </div>
      <ElButton
        class="link-aspect-button"
        @click="linkAspect"
        text
        size="small"
        circle
        :aria-label="
          state.aspectLink ? 'Unlink aspect ratio' : 'Link aspect ratio'
        "
      >
        <Icon
          icon="mingcute:link-2-line"
          class="link-aspect-icon"
          v-if="state.aspectLink"
        />
        <Icon icon="mingcute:unlink-2-line" class="link-aspect-icon" v-else />
      </ElButton>
    </div>
    <div class="opacity">
      <label>Opacity</label>
      <ElSlider
        v-model="state.opacity"
        :min="1"
        :max="100"
        class="opacity-slider"
      />
    </div>
    <div class="clickthrough">
      <ElButton
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
      </ElButton>
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
