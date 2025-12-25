<script setup lang="ts">
import { inject } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  asChild?: boolean
}>()

const setOpen = inject<(value: boolean) => void>('dialogSetOpen')

const handleClick = () => {
  setOpen?.(false)
}
</script>

<template>
  <button
    v-if="props.asChild !== true"
    @click="handleClick"
    class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none focus:outline-none focus-visible:outline-none"
    tabindex="-1"
    type="button"
  >
    <X class="h-4 w-4 text-onyx-400" />
    <span class="sr-only">Close</span>
  </button>
  <div
    v-else
    @click="handleClick"
    style="display: contents;"
  >
    <slot />
  </div>
</template>
