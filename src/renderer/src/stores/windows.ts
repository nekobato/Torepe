import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PaperWindowState } from '../../../shared/types/window'

export const useWindowsStore = defineStore('windows', () => {
  const windows = ref<Map<string, PaperWindowState>>(new Map())
  const activeWindowId = ref<string | null>(null)

  const activeWindow = computed(() => {
    if (!activeWindowId.value) return null
    return windows.value.get(activeWindowId.value) || null
  })

  const windowsList = computed(() => {
    return Array.from(windows.value.values())
  })

  function addWindow(window: PaperWindowState) {
    windows.value.set(window.id, window)
    if (!activeWindowId.value) {
      activeWindowId.value = window.id
    }
  }

  function updateWindow(windowId: string, updates: Partial<PaperWindowState>) {
    const window = windows.value.get(windowId)
    if (window) {
      windows.value.set(windowId, { ...window, ...updates })
    }
  }

  function removeWindow(windowId: string) {
    windows.value.delete(windowId)
    if (activeWindowId.value === windowId) {
      const remainingWindows = Array.from(windows.value.keys())
      activeWindowId.value = remainingWindows.length > 0 ? remainingWindows[0] : null
    }
  }

  function setActiveWindow(windowId: string) {
    if (windows.value.has(windowId)) {
      activeWindowId.value = windowId
    }
  }

  function getWindow(windowId: string) {
    return windows.value.get(windowId)
  }

  return {
    windows,
    activeWindowId,
    activeWindow,
    windowsList,
    addWindow,
    updateWindow,
    removeWindow,
    setActiveWindow,
    getWindow
  }
})