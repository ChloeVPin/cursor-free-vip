<script setup lang="ts">
import { provide, ref, watch } from 'vue'

const props = defineProps<{
  open?: boolean
  defaultOpen?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const internalOpen = ref(props.defaultOpen ?? false)

const isControlled = props.open !== undefined

const isOpen = ref(isControlled ? (props.open ?? false) : internalOpen.value)

watch(() => props.open, (newVal) => {
  if (newVal !== undefined) {
    isOpen.value = newVal
  }
}, { immediate: true })

const setOpen = (value: boolean) => {
  if (isControlled) {
    emit('update:open', value)
  } else {
    internalOpen.value = value
    isOpen.value = value
  }
}

provide('dialogOpen', isOpen)
provide('dialogSetOpen', setOpen)
</script>

<template>
  <slot />
</template>
