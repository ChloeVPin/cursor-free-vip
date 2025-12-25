<script setup lang="ts">
import { inject, computed, onMounted, onUnmounted } from 'vue'
import { Teleport } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()

const isOpen = inject<{ value: boolean }>('dialogOpen')
const setOpen = inject<(value: boolean) => void>('dialogSetOpen')

const isOpenValue = computed(() => isOpen?.value ?? false)

const contentClass = computed(() => cn(
  'fixed left-[50%] top-[50%] z-[51] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-onyx-700 bg-onyx-900 p-6 shadow-lg sm:rounded-lg',
  props.class
))

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    setOpen?.(false)
  }
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpenValue.value) {
    setOpen?.(false)
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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpenValue"
      class="fixed inset-0 z-50"
      @click="handleOverlayClick"
    >
      <div class="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div :class="contentClass" @click.stop>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
