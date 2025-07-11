<template>
  <div class="window-tabs">
    <Tabs v-model:value="activeWindowId">
      <TabList>
        <Tab
          v-for="window in windowsList"
          :key="window.id"
          :value="window.id"
          @click="() => handleTabChange(window.id)"
        >
          <div class="tab-header">
            <Icon icon="mingcute:pic-line" class="tab-icon" />
            <Button
              v-if="windowsList.length > 1"
              class="tab-close-btn"
              @click.stop="() => handleTabRemove(window.id)"
              text
              size="small"
            >
              <i class="pi pi-times"></i>
            </Button>
          </div>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel
          v-for="window in windowsList"
          :key="window.id"
          :value="window.id"
        >
          <div class="tab-content">
            <Dropper v-if="!window.imageData" :window-id="window.id" />
            <Controller
              v-else
              :window-id="window.id"
              :window-data="window as PaperWindowState"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Button
      class="add-window-btn"
      severity="primary"
      size="small"
      @click="addNewWindow"
      text
    >
      <i class="pi pi-plus"></i>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useWindowsStore } from "../stores/windows";
import Dropper from "../views/Dropper.vue";
import Controller from "../views/Controller.vue";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import Button from "primevue/button";
import { Icon } from "@iconify/vue";
import type { PaperWindowState } from "../../../shared/types/window";

const windowsStore = useWindowsStore();

const activeWindowId = ref<string>("");

// Local tabs that may not have paper windows yet
interface LocalTab extends Partial<PaperWindowState> {
  id: string;
  title: string;
  imageData?: any;
}

const localTabs = ref<LocalTab[]>([
  {
    id: `tab-${Date.now()}`,
    title: "New Tab",
  },
]);

const windowsList = computed<LocalTab[]>(() => {
  // Merge actual windows with local tabs
  const windows = [...windowsStore.windowsList];
  const localOnly = localTabs.value.filter(
    (tab) => !windows.find((w) => w.id === tab.id)
  );
  return [...windows, ...localOnly];
});

// Initialize active window
if (windowsList.value.length > 0 && !activeWindowId.value) {
  activeWindowId.value = windowsList.value[0].id;
}

const handleTabChange = async (windowId: string) => {
  if (windowId) {
    windowsStore.setActiveWindow(windowId);
    activeWindowId.value = windowId;

    // Focus the corresponding paper window if it exists
    if (windowsStore.windowsList.find((w) => w.id === windowId)) {
      try {
        await window.ipc.invoke("focus-paper-window", windowId);
      } catch (error) {
        console.error("Failed to focus paper window:", error);
      }
    }
  }
};

const handleTabRemove = async (windowId: string) => {
  // Check if it's a local tab or a window with paper window
  const localTabIndex = localTabs.value.findIndex((tab) => tab.id === windowId);
  if (localTabIndex !== -1) {
    // It's a local tab, just remove it
    localTabs.value.splice(localTabIndex, 1);
  } else {
    // It's a window with paper window, close the paper window
    try {
      await window.ipc.invoke("close-paper-window", windowId);
    } catch (error) {
      console.error("Failed to close paper window:", error);
    }
  }
};

const addNewWindow = async () => {
  // Just add a new local tab, don't create paper window yet
  const newTab: LocalTab = {
    id: `tab-${Date.now()}`,
    title: "New Tab",
  };
  localTabs.value.push(newTab);

  // Focus the new tab
  activeWindowId.value = newTab.id;
};

// IPC event handlers
const handlePaperWindowCreated = (_event: any, windowState: any) => {
  windowsStore.addWindow(windowState);
  // Remove corresponding local tab if it exists
  const localTabIndex = localTabs.value.findIndex(
    (tab) => tab.id === windowState.id
  );
  if (localTabIndex !== -1) {
    localTabs.value.splice(localTabIndex, 1);
  }
  activeWindowId.value = windowState.id;
};

const handlePaperWindowClosed = (_event: any, windowId: string) => {
  windowsStore.removeWindow(windowId);
  // Update active tab if needed
  if (activeWindowId.value === windowId && windowsList.value.length > 0) {
    activeWindowId.value = windowsList.value[0].id;
  }
};

const handlePaperWindowFocused = (_event: any, windowId: string) => {
  windowsStore.setActiveWindow(windowId);
  activeWindowId.value = windowId;
};

onMounted(() => {
  // Set up IPC event listeners
  window.ipc.on("paper-window-created", handlePaperWindowCreated);
  window.ipc.on("paper-window-closed", handlePaperWindowClosed);
  window.ipc.on("paper-window-focused", handlePaperWindowFocused);

  // Set initial active tab
  if (windowsStore.activeWindowId) {
    activeWindowId.value = windowsStore.activeWindowId;
  } else if (windowsList.value.length > 0) {
    activeWindowId.value = windowsList.value[0].id;
  }
});

onUnmounted(() => {
  // Clean up event listeners
  window.ipc.removeAllListeners("paper-window-created");
  window.ipc.removeAllListeners("paper-window-closed");
  window.ipc.removeAllListeners("paper-window-focused");
});
</script>

<style scoped>
.window-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.add-window-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.tab-content {
  height: calc(100vh - 60px);
  overflow: hidden;
}

:deep(.p-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-tablist) {
  flex-shrink: 0;
}

:deep(.p-tabpanels) {
  flex: 1;
  height: 0;
}

:deep(.p-tabpanel) {
  height: 100%;
  padding: 0;
}

.tab-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-close-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  min-width: 20px;
}
</style>
