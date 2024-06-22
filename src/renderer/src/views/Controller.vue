<script lang="ts" setup>
import { reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { ElButton, ElSlider, ElInputNumber } from "element-plus";

const router = useRouter();

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
  window.ipc.send("toggle-clickthrough", { toggle: !state.clickThrough });
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
  });
};

const resetImage = () => {
  window.ipc.send("reset-image");
  router.push("/dropper");
};
const linkAspect = () => {
  state.aspectLink = !state.aspectLink;
  window.ipc.send("link-aspect", {
    link: state.aspectLink,
    ratio: state.windowSize.width / state.windowSize.height,
  });
};

watch(
  () => state.opacity,
  (newOpacity) => {
    window.ipc.send("set-opacity", { opacity: newOpacity });
  }
);

window.ipc.on("window-rectangle", (_, { x, y, width, height, original }) => {
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
    <ElButton class="reset" @click="resetImage">
      <Icon class="icon" icon="mingcute:arrow-left-line" />
    </ElButton>
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
          <ElInputNumber
            v-model="state.windowSize.width"
            :min="1"
            size="small"
            class="input"
            @change="onChangeWidth"
          />
        </div>
        <div class="form-item">
          <label>Height</label>
          <ElInputNumber
            v-model="state.windowSize.height"
            :min="1"
            size="small"
            class="input"
            @change="onChangeHeight"
          />
        </div>
      </div>
      <ElButton class="link-aspect-button" @click="linkAspect" text circle>
        <Icon
          icon="mingcute:link-2-line"
          class="link-aspect-icon"
          v-if="state.aspectLink"
        />
        <Icon icon="mingcute:unlink-2-line" class="link-aspect-icon" v-else />
      </ElButton>
    </div>
    <div class="opacity">
      <label>OPACITY</label>
      <ElSlider
        v-model="state.opacity"
        :min="1"
        :max="100"
        class="opacity-slider"
      />
    </div>
    <div class="clickthrough">
      <ElButton
        v-model="state.clickThrough"
        :min="1"
        :max="100"
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
  height: 100%;
  gap: 8px;
  background-color: #252522;
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
}
</style>
