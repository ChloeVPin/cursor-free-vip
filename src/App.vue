<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePrivacy } from '@/composables/usePrivacy'
import TitleBar from '@/components/TitleBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import Dashboard from '@/views/Dashboard.vue'
import ResetMachineId from '@/views/ResetMachineId.vue'
import DisableUpdate from '@/views/DisableUpdate.vue'
import TokenBypass from '@/views/TokenBypass.vue'
import TotallyReset from '@/views/TotallyReset.vue'
import QuitCursor from '@/views/QuitCursor.vue'
import Settings from '@/views/Settings.vue'
import ManualAuth from '@/views/ManualAuth.vue'
import MultiAccountManager from '@/views/MultiAccountManager.vue'
import Watermark from '@/components/ui/Watermark.vue'

const currentView = ref('dashboard')
const logsPerView = ref<Record<string, string[]>>({})
let unsubscribe: (() => void) | null = null

const currentLogs = computed(() => {
  return logsPerView.value[currentView.value] || []
})

const views: Record<string, any> = {
  dashboard: Dashboard,
  resetMachineId: ResetMachineId,
  disableUpdate: DisableUpdate,
  tokenBypass: TokenBypass,
  totallyReset: TotallyReset,
  quitCursor: QuitCursor,
  settings: Settings,
  manualAuth: ManualAuth,
  multiAccountManager: MultiAccountManager
}

const handleNavigate = (view: string) => {
  currentView.value = view
}

const handleLog = (message: string) => {
  if (!logsPerView.value[currentView.value]) {
    logsPerView.value[currentView.value] = []
  }
  logsPerView.value[currentView.value].push(message)
}

const handleClearLogs = () => {
  logsPerView.value[currentView.value] = []
}

const handleCopy = (e: ClipboardEvent) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !e.clipboardData) return
  
  let text = selection.toString()
  
  const allElements = document.querySelectorAll('[data-original]')
  allElements.forEach((el) => {
    const original = el.getAttribute('data-original')
    const displayed = el.textContent || ''
    
    if (original && displayed && selection.containsNode(el, true)) {
      text = text.replace(displayed, original)
    }
  })
  
  e.clipboardData.setData('text/plain', text)
  e.preventDefault()
}

onMounted(() => {
  unsubscribe = window.electronAPI.onLog(handleLog)
  document.addEventListener('copy', handleCopy)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  document.removeEventListener('copy', handleCopy)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-onyx-950 flex flex-col">
    <TitleBar />
    
    <div class="flex-1 flex overflow-hidden">
      <Sidebar 
        :currentView="currentView" 
        @navigate="handleNavigate"
      />
      
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <Transition name="fade" mode="out-in">
          <component 
            :is="views[currentView]" 
            :key="currentView"
            :logs="currentLogs"
            @log="handleLog"
            @clear-logs="handleClearLogs"
          />
        </Transition>
      </main>
    </div>
    
    <Watermark />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
