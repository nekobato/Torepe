<template>
  <div class="window-tabs">
    <aside class="image-list-pane" aria-label="Image list">
      <Button
        class="add-window-btn"
        icon="pi pi-plus"
        severity="primary"
        size="small"
        rounded
        aria-label="Add image"
        title="Add image"
        @click="addNewWindow"
      />

      <div class="image-chip-list" role="listbox" aria-label="Images">
        <div
          v-for="window in windowsList"
          :key="window.id"
          class="image-chip-item"
          :class="{ 'is-active': activeWindowId === window.id }"
          role="option"
          :aria-selected="activeWindowId === window.id"
          tabindex="0"
          :title="getWindowFilename(window)"
          @click="() => handleChipSelect(window.id)"
          @keydown.enter.prevent="() => handleChipSelect(window.id)"
          @keydown.space.prevent="() => handleChipSelect(window.id)"
        >
          <Chip
            :key="`${window.id}-${getWindowFilename(window)}`"
            class="image-chip"
            :label="getWindowFilename(window)"
            removable
            @remove="(event) => handleChipRemove(window.id, event)"
          />
        </div>
      </div>
    </aside>

    <main class="active-window-content">
      <template v-if="activeWindow">
        <Dropper v-if="!activeWindow.imageData" :window-id="activeWindow.id" />
        <Controller
          v-else
          :key="activeWindow.id"
          :window-id="activeWindow.id"
          :window-data="activeWindow as PaperWindowState"
        />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useWindowsStore } from "../stores/windows";
import Dropper from "../views/Dropper.vue";
import Controller from "../views/Controller.vue";
import Button from "primevue/button";
import Chip from "primevue/chip";
import type { PaperWindowState } from "../../../shared/types/window";

const NEW_IMAGE_FILENAME = "New image";

const windowsStore = useWindowsStore();

const activeWindowId = ref<string>("");
let localTabCounter = 0;
let unsubscribeIpcListeners: Array<() => void> = [];

/** Controller-side item for a future paper window. */
interface LocalWindowItem extends Partial<PaperWindowState> {
  id: string;
  title: string;
  imageData?: PaperWindowState["imageData"];
}

type PaperWindowImageUpdatedPayload = {
  windowId: string;
  width: number;
  height: number;
  filename?: string;
};

/** Creates a local image item without opening a paper window yet. */
const createLocalWindowItem = (): LocalWindowItem => {
  localTabCounter += 1;
  return {
    id: `tab-${Date.now()}-${localTabCounter}`,
    title: NEW_IMAGE_FILENAME,
  };
};

const localTabs = ref<LocalWindowItem[]>([createLocalWindowItem()]);

const windowsList = computed<LocalWindowItem[]>(() => {
  const windows = [...windowsStore.windowsList];
  const localOnly = localTabs.value.filter(
    (tab) => !windows.find((window) => window.id === tab.id)
  );
  return [...windows, ...localOnly].reverse();
});

const activeWindow = computed(() => {
  return (
    windowsList.value.find((window) => window.id === activeWindowId.value) ??
    windowsList.value[0]
  );
});

/** Returns the filename shown inside the image chip. */
const getWindowFilename = (window: LocalWindowItem): string => {
  return window.imageData?.filename ?? NEW_IMAGE_FILENAME;
};

/** Returns whether an item already has a backing paper window. */
const hasPaperWindow = (windowId: string): boolean => {
  return windowsStore.windowsList.some((window) => window.id === windowId);
};

/** Selects the first available image item after removal. */
const selectFirstAvailableWindow = (): void => {
  const nextWindow = windowsList.value[0];
  activeWindowId.value = nextWindow?.id ?? "";

  if (nextWindow && hasPaperWindow(nextWindow.id)) {
    windowsStore.setActiveWindow(nextWindow.id);
  }
};

/** Selects a chip and focuses its paper window when one exists. */
const handleChipSelect = async (windowId: string): Promise<void> => {
  if (!windowId) return;

  activeWindowId.value = windowId;

  if (!hasPaperWindow(windowId)) {
    return;
  }

  windowsStore.setActiveWindow(windowId);

  try {
    await window.ipc.invoke("focus-paper-window", windowId);
  } catch (error) {
    console.error("Failed to focus paper window:", error);
  }
};

/** Removes a local image item or closes its backing paper window. */
const handleChipRemove = async (
  windowId: string,
  event: Event
): Promise<void> => {
  event.stopPropagation();
  const wasActive = activeWindowId.value === windowId;
  const localTabIndex = localTabs.value.findIndex((tab) => tab.id === windowId);

  if (localTabIndex !== -1) {
    localTabs.value.splice(localTabIndex, 1);
    if (wasActive) {
      selectFirstAvailableWindow();
    }
    return;
  }

  try {
    await window.ipc.invoke("close-paper-window", windowId);
  } catch (error) {
    console.error("Failed to close paper window:", error);
  }
};

/** Adds a new local image item and selects it. */
const addNewWindow = (): void => {
  const newTab = createLocalWindowItem();
  localTabs.value.push(newTab);
  activeWindowId.value = newTab.id;
};

/** Stores a newly created paper window and replaces its matching local item. */
const handlePaperWindowCreated = (
  _event: unknown,
  windowState: PaperWindowState
): void => {
  windowsStore.addWindow(windowState);

  const localTabIndex = localTabs.value.findIndex(
    (tab) => tab.id === windowState.id
  );
  if (localTabIndex !== -1) {
    localTabs.value.splice(localTabIndex, 1);
  }

  activeWindowId.value = windowState.id;
};

/** Removes a closed paper window from the list. */
const handlePaperWindowClosed = (_event: unknown, windowId: string): void => {
  windowsStore.removeWindow(windowId);

  if (activeWindowId.value === windowId || !activeWindow.value) {
    selectFirstAvailableWindow();
  }
};

/** Mirrors paper window focus into the chip selection state. */
const handlePaperWindowFocused = (_event: unknown, windowId: string): void => {
  windowsStore.setActiveWindow(windowId);
  activeWindowId.value = windowId;
};

/** Stores loaded image dimensions and filename for a paper window. */
const handlePaperWindowImageUpdated = (
  _event: unknown,
  payload: PaperWindowImageUpdatedPayload
): void => {
  const existing = windowsStore.getWindow(payload.windowId);
  if (!existing) return;

  windowsStore.updateWindow(payload.windowId, {
    imageData: {
      ...(existing.imageData ?? {}),
      filename:
        payload.filename ?? existing.imageData?.filename ?? NEW_IMAGE_FILENAME,
      width: payload.width,
      height: payload.height,
    },
  });
};

onMounted(async () => {
  try {
    const windowsState = await window.ipc.invoke("get-windows-state");
    (windowsState as PaperWindowState[]).forEach((windowState) => {
      windowsStore.addWindow(windowState);
    });
  } catch (error) {
    console.error("Failed to initialize windows state:", error);
  }

  unsubscribeIpcListeners = [
    window.ipc.on("paper-window-created", handlePaperWindowCreated),
    window.ipc.on("paper-window-closed", handlePaperWindowClosed),
    window.ipc.on("paper-window-focused", handlePaperWindowFocused),
    window.ipc.on("paper-window-image-updated", handlePaperWindowImageUpdated),
  ];

  if (windowsStore.activeWindowId) {
    activeWindowId.value = windowsStore.activeWindowId;
  } else if (windowsList.value.length > 0) {
    activeWindowId.value = windowsList.value[0].id;
  }
});

onUnmounted(() => {
  unsubscribeIpcListeners.forEach((unsubscribe) => unsubscribe());
  unsubscribeIpcListeners = [];
});
</script>

<style scoped>
.window-tabs {
  --image-list-min-width: 112px;
  --active-window-width: 240px;
  --add-window-btn-size: 32px;

  height: 100%;
  display: flex;
  min-height: 0;
}

.image-list-pane {
  flex: 1 1 var(--image-list-min-width);
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 8px 0 8px 16px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.add-window-btn {
  flex: 0 0 auto;
  align-self: center;
  width: var(--add-window-btn-size);
  height: var(--add-window-btn-size);
  min-width: var(--add-window-btn-size);
}

.image-chip-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.image-chip-item {
  width: 100%;
  min-width: 0;
  border-radius: 999px;
  cursor: pointer;
}

.image-chip-item:focus-visible {
  outline: 2px solid var(--p-primary-color, #3b82f6);
  outline-offset: 2px;
}

.image-chip-item.is-active :deep(.image-chip) {
  color: var(--p-primary-color, #3b82f6);
  background: color-mix(
    in srgb,
    var(--p-primary-color, #3b82f6) 12%,
    transparent
  );
  box-shadow: inset 0 0 0 1px currentColor;
}

:deep(.image-chip) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  justify-content: space-between;
  cursor: inherit;
}

:deep(.image-chip .p-chip-label) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2; /* bottom  */
}

:deep(.image-chip .p-chip-remove-icon) {
  flex: 0 0 auto;
}

.active-window-content {
  flex: 0 0 var(--active-window-width);
  height: 100%;
  width: var(--active-window-width);
  min-width: var(--active-window-width);
  max-width: var(--active-window-width);
  min-height: 0;
  overflow: hidden;
}
</style>
