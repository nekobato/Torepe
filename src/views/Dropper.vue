<template>
  <div class="form">
    <div
      class="drag-area"
      :class="{ 'on-dragover': isDragOver }"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragleave.prevent="onDragLeave"
    >
      <span class="drop-text">Drop image file here</span>
      <span class="or-text">or</span>
      <label class="file-button">
        <input
          class="file-field"
          type="file"
          accept="image/*"
          @change="onChangeFile"
        />
        <span class="text-row">Select file</span>
      </label>
      <button class="clipboard-button" @click="fromClipboard">
        <span class="text-row">Read clipboard</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcSend } from '../lib/ipc';

export default Vue.extend({
  name: 'dropper',
  data() {
    return {
      isDragOver: false,
    };
  },
  methods: {
    onDragOver() {
      this.isDragOver = true;
    },
    onDrop(e: DragEvent) {
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      const file = e.dataTransfer.files[0];
      if (!/^image\//.test(file.type)) return;
      this.sendFile(file);
      this.isDragOver = false;
    },
    onDragLeave() {
      this.isDragOver = false;
    },
    onChangeFile(e: any) {
      this.sendFile(e.target.files[0]);
    },
    sendFile(file: File) {
      const reader = new FileReader();
      reader.onload = () => {
        ipcSend('set-image', { type: 'data', data: reader.result });
        this.goToController();
      };
      reader.readAsDataURL(file);
    },
    fromClipboard() {
      ipcSend('set-image', { type: 'clipboard' });
      this.goToController();
    },
    goToController() {
      this.$router.push('/controller');
    },
  },
});
</script>

<style lang="postcss" scoped>
.form {
  padding: 16px;
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  .drag-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    text-align: center;
    border: 2px dotted rgba(0, 0, 0, 0.16);
    border-radius: 8px;
    &.on-dragover {
      border: 2px dotted rgba(0, 0, 0, 0.48);
    }
  }
  .drop-text {
    display: block;
    margin-top: 32px;
    font-size: 20px;
    color: rgba(0, 0, 0, 0.48);
  }
  .or-text {
    display: block;
    margin-top: 16px;
    color: rgba(0, 0, 0, 0.4);
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
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 4px;
    font-size: 14px;
    line-height: 16px;
    font-weight: bold;
    color: hsl(0, 0%, 60%);
    cursor: pointer;
    &:hover {
      border: 1px solid rgba(0, 0, 0, 0.54);
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
