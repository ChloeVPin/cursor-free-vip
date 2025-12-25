<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'glass' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const variantClasses = {
  default: 'bg-onyx-900 border-onyx-800',
  glass: 'bg-onyx-900/50 backdrop-blur-sm border-onyx-800/50',
  outline: 'bg-transparent border-onyx-700',
}

const cardClass = computed(() => cn(
  'rounded-lg border',
  variantClasses[props.variant]
))
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>
