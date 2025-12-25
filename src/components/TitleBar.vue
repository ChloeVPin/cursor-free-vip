<script setup lang="ts">
import { Minus, Square, X } from 'lucide-vue-next'
import { appMeta } from '@/lib/theme'
import iconImage from '@/assets/icon.svg'

const minimize = () => {
  if (window.electronAPI?.minimize) {
    window.electronAPI.minimize()
  }
}
const maximize = () => {
  if (window.electronAPI?.maximize) {
    window.electronAPI.maximize()
  }
}
const close = () => {
  if (window.electronAPI?.close) {
    window.electronAPI.close()
  }
}
</script>

<template>
  <header class="h-10 flex items-center justify-between bg-onyx-950 border-b border-onyx-800/50 drag-region">
    <!-- App title -->
    <div class="flex items-center gap-2 px-4">
      <img :src="iconImage" alt="Onyx Pass" class="w-5 h-5" />
      <span class="text-sm font-semibold text-onyx-300">{{ appMeta.name }}</span>
    </div>
    
    <!-- Window controls -->
    <div class="flex items-center no-drag">
      <button
        @click="minimize"
        class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-onyx-300 hover:bg-onyx-800 transition-colors"
      >
        <Minus class="w-4 h-4" />
      </button>
      <button
        @click="maximize"
        class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-onyx-300 hover:bg-onyx-800 transition-colors"
      >
        <Square class="w-3.5 h-3.5" />
      </button>
      <button
        @click="close"
        class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-error hover:bg-error/10 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
