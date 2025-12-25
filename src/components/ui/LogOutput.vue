<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Trash2, ChevronDown, Camera } from 'lucide-vue-next'
import html2canvas from 'html2canvas'
import { usePrivacy } from '@/composables/usePrivacy'
import { useI18n } from '@/composables/useI18n'
import { cn } from '@/lib/utils'

const { maskSensitiveInfo } = usePrivacy()
const { t } = useI18n()

interface Props {
  logs: string[]
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: '240px'
})

const emit = defineEmits<{
  clear: []
}>()

const containerRef = ref<HTMLElement | null>(null)
const logContainerRef = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const showScreenshotButton = ref(true)
const screenshotSuccess = ref(false)

const parseLogType = (line: string): 'info' | 'success' | 'warning' | 'error' | 'default' => {
  const lower = line.toLowerCase()
  if (lower.includes('error') || lower.includes('failed') || lower.includes('could not')) return 'error'
  if (lower.includes('success') || lower.includes('completed') || lower.includes('updated')) return 'success'
  if (lower.includes('warning') || lower.includes('may need')) return 'warning'
  if (lower.includes('starting') || lower.includes('reading') || lower.includes('writing')) return 'info'
  return 'default'
}

const logTypeClasses = {
  default: 'text-onyx-400 border-l-onyx-700',
  info: 'text-onyx-300 border-l-info/50',
  success: 'text-success border-l-success/50',
  warning: 'text-warning border-l-warning/50',
  error: 'text-error border-l-error/50',
}

const parseTextWithPaths = (text: string) => {
  const pathRegex = /(?:"([A-Za-z]:[\\/][^"]+)"|([A-Za-z]:[\\/](?:[^\\/:*?"<>|\r\n\s]+[\\/])*[^\\/:*?"<>|\r\n\s]+)|([\/~][^\s]*[\/][^\s]*)|([\/~][^\s]+))/g
  
  const parts: Array<{ text: string; isPath: boolean }> = []
  let lastIndex = 0
  let match
  
  while ((match = pathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), isPath: false })
    }
    
    const path = match[1] || match[2] || match[3] || match[4] || match[0]
    
    if (path && (path.includes('/') || path.includes('\\') || /^[A-Za-z]:/.test(path))) {
      parts.push({ text: path, isPath: true })
    } else {
      parts.push({ text: match[0], isPath: false })
    }
    
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isPath: false })
  }
  
  if (parts.length === 0) {
    parts.push({ text, isPath: false })
  }
  
  return parts
}

const parsedLogs = computed(() => 
  props.logs.map(line => {
    const cleanText = line.replace(/^[^\w\s]*\s*/, '')
    return {
      text: cleanText,
      parts: parseTextWithPaths(cleanText),
      type: parseLogType(line)
    }
  })
)

const handlePathClick = async (path: string) => {
  try {
    await window.electronAPI.openPath(path)
  } catch (err) {
    console.error('Failed to open path:', err)
  }
}

watch(() => props.logs.length, async () => {
  if (autoScroll.value && containerRef.value) {
    await nextTick()
    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }
})

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight
    autoScroll.value = true
  }
}

const handleScroll = () => {
  if (containerRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    autoScroll.value = scrollTop + clientHeight >= scrollHeight - 10
  }
}

const handleScreenshot = async () => {
  if (!logContainerRef.value) return
  
  try {
    showScreenshotButton.value = false
    
    const canvas = await html2canvas(logContainerRef.value, {
      backgroundColor: null,
      scale: 2,
      logging: false
    })
    
    const imageData = canvas.toDataURL('image/png')
    
    const result = await window.electronAPI.saveScreenshot(imageData)
    
    if (result.success) {
      screenshotSuccess.value = true
      
      setTimeout(() => {
        screenshotSuccess.value = false
        showScreenshotButton.value = true
      }, 5000)
    } else {
      showScreenshotButton.value = true
      console.error('Failed to save screenshot:', result.error)
    }
  } catch (err) {
    console.error('Failed to take screenshot:', err)
    showScreenshotButton.value = true
  }
}
</script>

<template>
  <div class="flex flex-col h-full rounded-lg border border-onyx-800 bg-onyx-900/50 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-onyx-800 bg-onyx-900/80">
      <span class="text-xs font-medium text-onyx-400">Output</span>
      <div class="flex items-center gap-1">
        <button
          v-if="!autoScroll"
          @click="scrollToBottom"
          class="p-1 rounded hover:bg-onyx-800 text-onyx-500 hover:text-onyx-300 transition-colors"
          title="Scroll to bottom"
        >
          <ChevronDown class="w-3.5 h-3.5" />
        </button>
        <button
          v-if="showScreenshotButton && !screenshotSuccess"
          @click="handleScreenshot"
          class="p-1 rounded hover:bg-onyx-800 text-onyx-500 hover:text-onyx-300 transition-colors"
          :title="t('logOutput.screenshot')"
        >
          <Camera class="w-3.5 h-3.5" />
        </button>
        <span
          v-if="screenshotSuccess"
          class="text-xs text-success font-medium"
        >
          {{ t('logOutput.screenshotSuccess') }}
        </span>
        <button
          @click="emit('clear')"
          class="p-1 rounded hover:bg-onyx-800 text-onyx-500 hover:text-onyx-300 transition-colors"
          title="Clear logs"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    
    <!-- Log content -->
    <div
      ref="containerRef"
      class="flex-1 overflow-y-auto overflow-x-hidden font-mono"
      :style="{ maxHeight: props.maxHeight }"
      @scroll="handleScroll"
    >
      <div ref="logContainerRef" class="min-h-full">
        <div v-if="parsedLogs.length === 0" class="flex items-center justify-center" :style="{ minHeight: props.maxHeight }">
          <span class="text-xs text-onyx-600">No output yet</span>
        </div>
        
        <div v-else class="py-1">
          <div
            v-for="(log, index) in parsedLogs"
            :key="index"
            :class="cn(
              'px-3 py-0.5 text-xs border-l-2 whitespace-pre-wrap break-all',
              logTypeClasses[log.type]
            )"
          >
            <span class="text-onyx-600 select-none mr-2">{{ String(index + 1).padStart(3, '0') }}</span>
            <template v-for="(part, partIndex) in log.parts" :key="partIndex">
              <span
                v-if="part.isPath"
                @click="handlePathClick(part.text)"
                class="text-gold-400 hover:text-gold-300 underline cursor-pointer transition-colors"
                :data-original="part.text"
                :title="`Click to open: ${part.text}`"
              >
                {{ maskSensitiveInfo(part.text) }}
              </span>
              <span v-else>{{ maskSensitiveInfo(part.text) }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
