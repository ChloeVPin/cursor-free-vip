<script setup lang="ts">
import { ref } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import LogOutput from '@/components/ui/LogOutput.vue'
import { KeyRound, CheckCircle, AlertTriangle, Info } from 'lucide-vue-next'
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

const email = ref('')
const token = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const showInfoDialog = ref(false)

const updateAuth = async () => {
  if (!email.value || !token.value) {
    error.value = t('auth.error')
    return
  }
  
  loading.value = true
  success.value = false
  error.value = ''
  emit('clear-logs')
  
  try {
    emit('log', 'Updating authentication...')
    
    const result = await window.electronAPI.updateAuth({
      email: email.value,
      accessToken: token.value,
      refreshToken: token.value
    })
    
    if (result.success) {
      success.value = true
      emit('log', 'Authentication updated successfully.')
      emit('log', '')
      emit('log', 'Next steps:')
      emit('log', '  - Reset Machine ID')
      emit('log', '  - Apply Token Limit Bypass')
      emit('log', '  - Restart Cursor')
    } else {
      error.value = result.error || 'Unknown error'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to update authentication'
    emit('log', `Error: ${error.value}`)
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1>{{ t('auth.title') }}</h1>
      <p class="mt-1">{{ t('auth.subtitle') }}</p>
    </div>
    
    <!-- Info Card -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gold-500/10">
            <KeyRound class="w-5 h-5 text-gold-400" />
          </div>
          <h3 class="text-sm font-medium text-onyx-200">{{ t('auth.whatThisDoes') }}</h3>
        </div>

        <button
          @click="showInfoDialog = true"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          :title="t('common.whatThisDoes')"
        >
          <Info class="w-4 h-4" />
        </button>
        
        <InfoModal :open="showInfoDialog" :title="t('auth.whatThisDoes')" @update:open="showInfoDialog = $event">
          <p class="text-sm text-onyx-300 leading-relaxed">{{ t('auth.features') }}</p>
        </InfoModal>
      </div>
    </Card>
    
    <!-- Form -->
    <Card variant="glass" class="p-4">
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-onyx-300 mb-2">{{ t('auth.emailLabel') }}</label>
          <Input 
            v-model="email" 
            type="email" 
            :placeholder="t('auth.emailPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-sm text-onyx-300 mb-2">{{ t('auth.tokenLabel') }}</label>
          <Input 
            v-model="token" 
            type="password" 
            :placeholder="t('auth.tokenPlaceholder')"
          />
          <p class="text-xs text-onyx-500 mt-1">{{ t('auth.tokenHint') }}</p>
        </div>
      </div>
    </Card>
    
    <!-- Error Message -->
    <div v-if="error" class="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
      <AlertTriangle class="w-5 h-5 text-red-400 flex-shrink-0" />
      <p class="text-sm text-red-200">{{ error }}</p>
    </div>
    
    <!-- Action Button -->
    <div class="flex gap-4">
      <Button 
        variant="gold" 
        size="lg" 
        @click="updateAuth"
        :loading="loading"
        :disabled="loading || !email || !token"
        class="flex-1"
      >
        <KeyRound class="w-4 h-4" />
        {{ t('auth.button') }}
      </Button>
    </div>
    
    <!-- Success Message -->
    <div v-if="success" class="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle class="w-5 h-5 text-green-400 flex-shrink-0" />
      <p class="text-sm text-green-200">{{ t('auth.success') }}</p>
    </div>
    
    <!-- Log Output -->
    <div class="flex-1 min-h-[200px]">
      <LogOutput :logs="logs" @clear="emit('clear-logs')" />
    </div>
  </div>
</template>
