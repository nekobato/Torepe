<script lang="ts" setup>
import { onMounted, reactive, onUnmounted } from "vue";
import { useWindowsStore } from "../stores/windows";

interface Props {
  windowId: string;
}

const props = defineProps<Props>();
const windowsStore = useWindowsStore();

const state = reactive({ isDragOver: false });

const onDragOver = () => {
  state.isDragOver = true;
};
const onDrop = (e: DragEvent) => {
  if (!e.dataTransfer || !e.dataTransfer.files.length) return;
  const file = e.dataTransfer.files[0];
  if (!/^image\//.test(file.type)) return;
  sendFile(file);
  state.isDragOver = false;
};
const onDragLeave = () => {
  state.isDragOver = false;
};
const onChangeFile = (e: any) => {
  sendFile(e.target.files[0]);
};
const sendFile = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async () => {
    // Create paper window if it doesn't exist
    const isLocalTab = !windowsStore.windowsList.find(
      (w) => w.id === props.windowId
    );
    let targetWindowId = props.windowId;

    if (isLocalTab) {
      // Create paper window and get its ID
      const newWindowId = await window.ipc.invoke(
        "create-paper-window-with-id",
        props.windowId
      );
      targetWindowId = newWindowId;
    }

    window.ipc.send("set-image", {
      type: "data",
      data: reader.result,
      windowId: targetWindowId,
    });
  };
  reader.readAsDataURL(file);
};
const fromClipboard = async () => {
  // Create paper window if it doesn't exist
  const isLocalTab = !windowsStore.windowsList.find(
    (w) => w.id === props.windowId
  );
  let targetWindowId = props.windowId;

  if (isLocalTab) {
    // Create paper window and get its ID
    const newWindowId = await window.ipc.invoke(
      "create-paper-window-with-id",
      props.windowId
    );
    targetWindowId = newWindowId;
  }

  window.ipc.send("set-image", {
    type: "clipboard",
    windowId: targetWindowId,
  });
};

const handleGotoController = (event: any, payload: any) => {
  if (payload.windowId === props.windowId) {
    // Update window state to show it has an image
    windowsStore.updateWindow(props.windowId, {
      imageData: {
        path: "",
        dataUrl: "",
        width: 0,
        height: 0,
      },
    });
  }
};

onMounted(() => {
  window.ipc.on("goto-controller", handleGotoController);
});
</script>
<template>
  <div class="form">
    <div
      class="drag-area"
      :class="{ 'on-dragover': state.isDragOver }"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragleave.prevent="onDragLeave"
    >
      <span class="drop-text">Drop Image</span>
      <span class="or-text">or</span>
      <label class="file-button">
        <input
          class="file-field"
          type="file"
          accept="image/*"
          @change="onChangeFile"
        />
        <span class="text-row">Select image file</span>
      </label>
      <button class="clipboard-button" @click="fromClipboard">
        <span class="text-row">Read clipboard</span>
      </button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.form {
  padding: 16px;
  width: 100%;
  height: 100%;
  .drag-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    text-align: center;
    border: 2px dotted rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    &.on-dragover {
      border: 2px dotted rgba(255, 255, 255, 0.48);
    }
  }
  .drop-text {
    display: block;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.48);
  }
  .or-text {
    display: block;
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.4);
  }
  .file-button,
  .clipboard-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    width: 160px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 4px;
    font-size: 14px;
    line-height: 16px;
    font-weight: bold;
    color: hsl(0, 0%, 60%);
    cursor: pointer;
    &:hover {
      border: 1px solid rgba(255, 255, 255, 0.54);
    }
  }
  .file-button {
    margin-top: 16px;
  }
  .clipboard-button {
    margin-top: 8px;
  }
  .text-row {
    display: block;
  }
  .file-field {
    display: none;
  }
}
</style>
