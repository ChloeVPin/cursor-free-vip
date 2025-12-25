<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { Teleport } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  open: boolean
  title: string
  class?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const handleClose = () => {
  emit('update:open', false)
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) {
    handleClose()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleEscape)
  }
})

const contentClass = computed(() => cn(
  'fixed left-[50%] top-[50%] z-[51] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-onyx-700 bg-onyx-900 p-6 shadow-lg sm:rounded-lg',
  props.class
))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50"
      @click="handleOverlayClick"
    >
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div :class="contentClass" @click.stop>
        <button
          @click="handleClose"
          class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:outline-none"
          type="button"
        >
          <X class="h-4 w-4 text-onyx-400" />
          <span class="sr-only">Close</span>
        </button>
        
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h3 class="text-lg font-semibold leading-none tracking-tight text-onyx-100">
            {{ title }}
          </h3>
        </div>
        
        <div class="mt-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

