<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | null
  originalValue?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  originalValue: undefined
})

const copied = ref(false)

const copyToClipboard = async () => {
  const textToCopy = props.originalValue ?? props.value
  if (!textToCopy) return
  
  try {
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="rounded-md bg-onyx-900/50 border border-onyx-800/50 p-3">
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-onyx-500 font-medium">{{ label }}</span>
      <button
        @click="copyToClipboard"
        :disabled="!value"
        :class="cn(
          'p-1 rounded transition-colors',
          value 
            ? 'hover:bg-onyx-800 text-onyx-500 hover:text-onyx-300' 
            : 'text-onyx-700 cursor-not-allowed'
        )"
        :title="copied ? 'Copied!' : 'Copy to clipboard'"
      >
        <Check v-if="copied" class="w-3.5 h-3.5 text-success" />
        <Copy v-else class="w-3.5 h-3.5" />
      </button>
    </div>
    <div class="overflow-x-auto scrollbar-thin">
      <code class="text-xs font-mono text-onyx-300 whitespace-nowrap block">
        {{ value || 'N/A' }}
      </code>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--color-onyx-700)) rgb(var(--color-onyx-900));
}

.scrollbar-thin::-webkit-scrollbar {
  height: 3px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: rgb(var(--color-onyx-900));
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, rgb(var(--color-onyx-700)), rgb(var(--color-onyx-600)));
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, rgb(var(--color-onyx-600)), rgb(var(--color-onyx-500)));
}
</style>

