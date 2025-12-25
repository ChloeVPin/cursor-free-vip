<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  loading: false
})

const variantClasses = {
  default: 'bg-onyx-100 text-onyx-900 hover:bg-onyx-200',
  secondary: 'bg-onyx-800 text-onyx-100 hover:bg-onyx-700',
  outline: 'border border-onyx-700 bg-transparent text-onyx-200 hover:bg-onyx-800 hover:text-onyx-100',
  ghost: 'bg-transparent text-onyx-400 hover:bg-onyx-800 hover:text-onyx-200',
  gold: 'bg-gold-500 text-onyx-950 hover:bg-gold-400 font-medium',
  destructive: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
}

const sizeClasses = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9',
}

const buttonClass = computed(() => cn(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
  'disabled:pointer-events-none disabled:opacity-50',
  variantClasses[props.variant],
  sizeClasses[props.size]
))
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled || loading"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </button>
</template>
