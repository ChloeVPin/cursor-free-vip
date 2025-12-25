<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import LogOutput from '@/components/ui/LogOutput.vue'
import { Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import InfoModal from '@/components/ui/InfoModal.vue'

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
const showConfirm = ref(false)
const showInfoDialog = ref(false)

const confirmReset = () => {
  showConfirm.value = true
}

const cancelReset = () => {
  showConfirm.value = false
}

const totallyReset = async () => {
  showConfirm.value = false
  loading.value = true
  success.value = false
  error.value = ''
  emit('clear-logs')
  
  try {
    emit('log', 'Closing Cursor application...')
    await window.electronAPI.quitCursor()
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const result = await window.electronAPI.totallyReset()
    
    if (result.success) {
      success.value = true
    } else {
      error.value = result.error || 'Unknown error'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to reset Cursor'
    emit('log', `Error: ${error.value}`)
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1>{{ t('totallyReset.title') }}</h1>
      <p class="mt-1">{{ t('totallyReset.subtitle') }}</p>
    </div>
    
    <!-- Warning Card -->
    <Card variant="glass" class="p-4 border-error/20 bg-error/5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-error/10">
            <Trash2 class="w-5 h-5 text-error" />
          </div>
          <h3 class="text-sm font-medium text-error">{{ t('totallyReset.warning') }}</h3>
        </div>

        <button
          @click="showInfoDialog = true"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-error hover:text-error hover:bg-error/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/50"
          :title="t('common.whatThisDoes')"
        >
          <Info class="w-4 h-4" />
        </button>
        
        <InfoModal :open="showInfoDialog" :title="t('totallyReset.warning')" @update:open="showInfoDialog = $event">
          <p class="text-sm text-onyx-300 leading-relaxed">{{ t('totallyReset.features') }}</p>
          <p class="text-sm text-onyx-400 mt-3 leading-relaxed">{{ t('totallyReset.note') }}</p>
        </InfoModal>
      </div>
    </Card>
    
    <!-- Confirmation Dialog -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card variant="glass" class="w-full max-w-md p-6 m-4">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-4">
            <AlertTriangle class="w-8 h-8 text-error" />
          </div>
          <h3 class="text-lg font-semibold text-onyx-100 mb-2">{{ t('totallyReset.confirmTitle') }}</h3>
          <p class="text-sm text-onyx-400 mb-6">{{ t('totallyReset.confirmMessage') }}</p>
          <div class="flex gap-3">
            <Button variant="ghost" class="flex-1" @click="cancelReset">
              {{ t('totallyReset.cancel') }}
            </Button>
            <Button variant="destructive" class="flex-1" @click="totallyReset">
              {{ t('totallyReset.confirm') }}
            </Button>
          </div>
        </div>
      </Card>
    </div>
    
    <!-- Action Button -->
    <div class="flex gap-4">
      <Button 
        variant="destructive" 
        size="lg" 
        @click="confirmReset"
        :loading="loading"
        :disabled="loading"
        class="flex-1"
      >
        <Trash2 class="w-4 h-4" />
        {{ t('totallyReset.button') }}
      </Button>
    </div>
    
    <!-- Success Message -->
    <div v-if="success" class="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
      <CheckCircle class="w-5 h-5 text-success flex-shrink-0" />
      <div>
        <p class="text-sm text-success">{{ t('totallyReset.success') }}</p>
        <p class="text-xs text-success/70 mt-1">{{ t('totallyReset.successNote') }}</p>
      </div>
    </div>
    
    <!-- Log Output -->
    <div class="flex-1 min-h-[200px]">
      <LogOutput :logs="logs" @clear="emit('clear-logs')" />
    </div>
  </div>
</template>
