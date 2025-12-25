<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  type?: string
  placeholder?: string
  modelValue?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClass = cn(
  'flex h-10 w-full rounded-md border border-onyx-700 bg-onyx-900 px-3 py-2',
  'text-sm text-onyx-100 placeholder:text-onyx-500',
  'focus:outline-none focus:border-gold-500',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'transition-colors'
)
</script>

<template>
  <input
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    :disabled="disabled"
    :class="inputClass"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
