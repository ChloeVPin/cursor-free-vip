<script setup lang="ts">
import { appMeta } from '@/lib/theme'

const handleClick = () => {
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(appMeta.github)
  }
}
</script>

<template>
  <div class="fixed bottom-1 right-1 z-[9999] pointer-events-auto" style="position: fixed !important; bottom: 4px !important; right: 4px !important;">
    <button
      @click="handleClick"
      class="text-[10px] text-onyx-500 hover:text-onyx-400 transition-colors duration-200 font-mono opacity-50 hover:opacity-70 cursor-pointer"
      title="Made by ChloeVPin"
    >
      made by {{ appMeta.author }}
    </button>
  </div>
</template>

