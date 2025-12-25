<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import LogOutput from '@/components/ui/LogOutput.vue'
import { RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import InfoModal from '@/components/ui/InfoModal.vue'
import { cn } from '@/lib/utils'

const { t } = useI18n()

const props = defineProps<{
  logs: string[]
}>()

const emit = defineEmits<{
  log: [message: string]
  'clear-logs': []
}>()

const loading = ref(false)
const success = ref(false)
const error = ref('')
const showInfoDialog = ref(false)

const resetMachineIds = async () => {
  loading.value = true
  success.value = false
  error.value = ''
  emit('clear-logs')
  
  try {
    emit('log', 'Closing Cursor application...')
    await window.electronAPI.quitCursor()
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const result = await window.electronAPI.resetMachineIds()
    
    if (result.success) {
      success.value = true
      emit('log', '')
      emit('log', 'Machine ID reset completed successfully.')
      emit('log', 'Please restart Cursor for changes to take effect.')
    } else {
      error.value = result.error || 'Unknown error'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to reset machine IDs'
    emit('log', `Error: ${error.value}`)
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1>{{ t('reset.title') }}</h1>
      <p class="mt-1">{{ t('reset.subtitle') }}</p>
    </div>
    
    <!-- Info Card -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gold-500/10">
            <RefreshCw class="w-5 h-5 text-gold-400" />
          </div>
          <h3 class="text-sm font-medium text-onyx-200">{{ t('reset.whatThisDoes') }}</h3>
        </div>

        <button
          @click="showInfoDialog = true"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          :title="t('common.whatThisDoes')"
        >
          <Info class="w-4 h-4" />
        </button>
        
        <InfoModal :open="showInfoDialog" :title="t('reset.whatThisDoes')" @update:open="showInfoDialog = $event">
          <p class="text-sm text-onyx-300 leading-relaxed">{{ t('reset.features') }}</p>
        </InfoModal>
      </div>
    </Card>
    
    <!-- Warning -->
    <div class="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
      <AlertTriangle class="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <p class="text-sm text-yellow-200">{{ t('reset.warning') }}</p>
    </div>
    
    <!-- Action Button -->
    <div class="flex gap-4">
      <Button 
        variant="gold" 
        size="lg" 
        @click="resetMachineIds"
        :loading="loading"
        :disabled="loading"
        class="flex-1"
      >
        <RefreshCw class="w-4 h-4" />
        {{ t('reset.button') }}
      </Button>
    </div>
    
    <!-- Success Message -->
    <div v-if="success" class="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle class="w-5 h-5 text-green-400 flex-shrink-0" />
      <p class="text-sm text-green-200">{{ t('reset.success') }}</p>
    </div>
    
    <!-- Log Output -->
    <div class="flex-1 min-h-[200px]">
      <LogOutput :logs="logs" @clear="emit('clear-logs')" />
    </div>
  </div>
</template>
