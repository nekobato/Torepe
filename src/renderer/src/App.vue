<script setup lang="ts">
import { onMounted } from 'vue'
import WindowTabs from './components/WindowTabs.vue'
import { useWindowsStore } from './stores/windows'

const windowsStore = useWindowsStore()

onMounted(async () => {
  // Initialize windows state from main process
  try {
    const windowsState = await window.ipc.invoke('get-windows-state')
    windowsState.forEach((windowState: any) => {
      windowsStore.addWindow(windowState)
    })
  } catch (error) {
    console.error('Failed to initialize windows state:', error)
  }
})
</script>

<template>
  <WindowTabs />
</template>

<style>
#app {
  width: 100vw;
  height: 100vh;
  font-family: "Zen Kaku Gothic New";
  background-color: transparent;
  color: #a5a5a5;
}
</style>
