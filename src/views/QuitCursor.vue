<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import LogOutput from '@/components/ui/LogOutput.vue'
import { Power, CheckCircle, Info } from 'lucide-vue-next'
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
const showInfoDialog = ref(false)

const quitCursor = async () => {
  loading.value = true
  success.value = false
  emit('clear-logs')
  
  try {
    await window.electronAPI.quitCursor()
    success.value = true
  } catch (e: any) {
    emit('log', `Error: ${e.message}`)
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1>{{ t('quit.title') }}</h1>
      <p class="mt-1">{{ t('quit.subtitle') }}</p>
    </div>
    
    <!-- Info Card -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gold-500/10">
            <Power class="w-5 h-5 text-gold-400" />
          </div>
          <h3 class="text-sm font-medium text-onyx-200">{{ t('quit.whatThisDoes') }}</h3>
        </div>

        <button
          @click="showInfoDialog = true"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          :title="t('common.whatThisDoes')"
        >
          <Info class="w-4 h-4" />
        </button>
        
        <InfoModal :open="showInfoDialog" :title="t('quit.whatThisDoes')" @update:open="showInfoDialog = $event">
          <p class="text-sm text-onyx-300 leading-relaxed">{{ t('quit.features') }}</p>
        </InfoModal>
      </div>
    </Card>
    
    <!-- Action Button -->
    <div class="flex gap-4">
      <Button 
        variant="gold" 
        size="lg" 
        @click="quitCursor"
        :loading="loading"
        :disabled="loading"
        class="flex-1"
      >
        <Power class="w-4 h-4" />
        {{ t('quit.button') }}
      </Button>
    </div>
    
    <!-- Success Message -->
    <div v-if="success" class="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle class="w-5 h-5 text-green-400 flex-shrink-0" />
      <p class="text-sm text-green-200">{{ t('quit.success') }}</p>
    </div>
    
    <!-- Log Output -->
    <div class="flex-1 min-h-[200px]">
      <LogOutput :logs="logs" @clear="emit('clear-logs')" />
    </div>
  </div>
</template>
