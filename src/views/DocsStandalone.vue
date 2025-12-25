<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ChevronDown, ChevronRight, Rocket, Zap, HelpCircle, RefreshCw, KeyRound, Shield, Lock, Power, Trash2, Minus, Square, X, Info, Wrench, CheckCircle2, Users } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { useTextScaling } from '@/composables/useTextScaling'
import { cn } from '@/lib/utils'
import { appMeta } from '@/lib/theme'
import Button from '@/components/ui/Button.vue'
import iconImage from '@/assets/icon.svg'

const { t, tArray } = useI18n()
const { scaleTextToFit } = useTextScaling()
const expandedFaq = ref<number | null>(null)
const activeSection = ref('getting-started')
const featuresExpanded = ref(true)
const fixingWorkbench = ref(false)
const workbenchFixSuccess = ref(false)
const fixingLocation = ref(false)
const locationFixSuccess = ref(false)
const fixButtonRef = ref<HTMLElement | null>(null)
const fixContainerRef = ref<HTMLElement | null>(null)
const locationButtonRef = ref<HTMLElement | null>(null)
const locationContainerRef = ref<HTMLElement | null>(null)

const getFeatureDesc = (id: string) => {
  const descMap: Record<string, string> = {
    'reset-machine-id': 'reset.features',
    'manual-auth': 'auth.features',
    'multi-account-manager': 'multiAccount.features',
    'disable-update': 'update.features',
    'token-limit': 'token.features',
    'quit-cursor': 'quit.features',
    'totally-reset': 'totallyReset.features',
  }
  return t(descMap[id] || '')
}

const toggleFaq = (index: number) => {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

const sections = [
  { id: 'getting-started', labelKey: 'docs.gettingStarted', icon: Rocket },
  { id: 'features', labelKey: 'docs.features', icon: Zap, hasChildren: true },
  { id: 'troubleshooting', labelKey: 'docs.troubleshooting', icon: Wrench },
  { id: 'faq', labelKey: 'docs.faq', icon: HelpCircle },
]

const featureSections = [
  { id: 'reset-machine-id', label: 'docs.resetMachineIdTitle', icon: RefreshCw },
  { id: 'manual-auth', label: 'docs.manualAuthTitle', icon: KeyRound },
  { id: 'multi-account-manager', label: 'docs.multiAccountManagerTitle', icon: Users },
  { id: 'disable-update', label: 'docs.disableUpdateTitle', icon: Shield },
  { id: 'token-limit', label: 'docs.tokenLimitTitle', icon: Lock },
  { id: 'quit-cursor', label: 'docs.quitCursorTitle', icon: Power },
  { id: 'totally-reset', label: 'docs.totallyResetTitle', icon: Trash2 },
]

const isFeatureSection = computed(() => featureSections.some(f => f.id === activeSection.value))

const handleMinimize = () => {
  try {
    if (window.electronAPI?.docsMinimize) {
      window.electronAPI.docsMinimize().catch((err) => {
        console.error('Failed to minimize docs window:', err)
      })
    } else {
      console.error('electronAPI.docsMinimize is not available')
    }
  } catch (err) {
    console.error('Error in handleMinimize:', err)
  }
}

const handleMaximize = () => {
  try {
    if (window.electronAPI?.docsMaximize) {
      window.electronAPI.docsMaximize().catch((err) => {
        console.error('Failed to maximize docs window:', err)
      })
    } else {
      console.error('electronAPI.docsMaximize is not available')
    }
  } catch (err) {
    console.error('Error in handleMaximize:', err)
  }
}

const handleClose = () => {
  try {
    if (window.electronAPI?.docsClose) {
      window.electronAPI.docsClose().catch((err) => {
        console.error('Failed to close docs window:', err)
      })
    } else {
      console.error('electronAPI.docsClose is not available')
    }
  } catch (err) {
    console.error('Error in handleClose:', err)
  }
}

const handleFixWorkbench = async () => {
  fixingWorkbench.value = true
  workbenchFixSuccess.value = false
  
  try {
    const result = await window.electronAPI.fixWorkbenchFile()
    if (result.success) {
      workbenchFixSuccess.value = true
    }
  } catch (err) {
    console.error('Failed to fix workbench file:', err)
  } finally {
    fixingWorkbench.value = false
  }
}

const handleFixLocation = async () => {
  fixingLocation.value = true
  locationFixSuccess.value = false
  
  try {
    const result = await window.electronAPI.fixCursorLocation()
    if (result.success) {
      locationFixSuccess.value = true
    }
  } catch (err) {
    console.error('Failed to fix Cursor location:', err)
  } finally {
    fixingLocation.value = false
  }
}

const scaleFixText = async () => {
  await nextTick()
  if (fixContainerRef.value) {
    const containerWidth = fixContainerRef.value.offsetWidth
    const gap = 12
    
    const buttonText = fixContainerRef.value.querySelector('.fix-button-text') as HTMLElement
    if (buttonText) {
      const buttonWidth = fixButtonRef.value?.offsetWidth || 0
      const availableButtonWidth = Math.min(buttonWidth - 32, containerWidth * 0.4)
      scaleTextToFit(buttonText, availableButtonWidth, 14)
    }
    
  }
}

watch([workbenchFixSuccess, activeSection], async () => {
  if (activeSection.value === 'troubleshooting') {
    await nextTick()
    await scaleFixText()
  }
})

onMounted(async () => {
  if (activeSection.value === 'troubleshooting') {
    await scaleFixText()
  }
  const resizeHandler = () => scaleFixText()
  window.addEventListener('resize', resizeHandler)
  
  return () => {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-onyx-950 flex flex-col">
    <header class="h-10 flex items-center justify-between bg-onyx-950 border-b border-onyx-800/50 drag-region">
      <div class="flex items-center gap-2 px-4">
        <img :src="iconImage" :alt="appMeta.name" class="w-5 h-5" />
        <span class="text-sm font-semibold text-onyx-300">Documentation</span>
      </div>
      <div class="flex items-center no-drag">
        <button
          @click="handleMinimize"
          class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-onyx-300 hover:bg-onyx-800 transition-colors"
        >
          <Minus class="w-4 h-4" />
        </button>
        <button
          @click="handleMaximize"
          class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-onyx-300 hover:bg-onyx-800 transition-colors"
        >
          <Square class="w-3.5 h-3.5" />
        </button>
        <button
          @click="handleClose"
          class="w-10 h-10 flex items-center justify-center text-onyx-500 hover:text-error hover:bg-error/10 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </header>
    
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-72 border-r border-onyx-800/50 bg-onyx-950 flex flex-col flex-shrink-0">
        <nav class="flex-1 overflow-y-auto py-6 pl-4 pr-6 text-sm">
          <ul class="flex flex-col gap-1">
            <li v-for="section in sections" :key="section.id">
              <!-- Regular Section -->
              <button
                v-if="!section.hasChildren"
                @click="activeSection = section.id"
                :class="cn(
                  'text-onyx-400/80 hover:bg-onyx-900/50 hover:text-gold-400 flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
                  activeSection === section.id && 'bg-onyx-900/50 !text-gold-400 font-medium'
                )"
              >
                <component :is="section.icon" class="w-4 h-4 flex-shrink-0" />
                <span class="flex-1 min-w-0">{{ t(section.labelKey) }}</span>
              </button>

              <!-- Expandable Section (Features) -->
              <div v-else>
                <button
                  @click="featuresExpanded = !featuresExpanded"
                  :class="cn(
                    'text-onyx-400/80 hover:bg-onyx-900/50 hover:text-gold-400 flex h-8 w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
                    (activeSection === section.id || isFeatureSection) && 'bg-onyx-900/50 !text-gold-400 font-medium'
                  )"
                >
                  <component 
                    :is="ChevronDown" 
                    class="w-4 h-4 flex-shrink-0 transition-transform"
                    :class="[!featuresExpanded && '-rotate-90']"
                  />
                  <component :is="section.icon" class="w-4 h-4 flex-shrink-0" />
                  <span class="flex-1 min-w-0">{{ t(section.labelKey) }}</span>
                </button>

                <!-- Feature Subsections -->
                <ul v-show="featuresExpanded" class="mx-3.5 mt-1 flex flex-col gap-1 border-l border-onyx-800/50 px-2.5 py-1">
                  <li v-for="feature in featureSections" :key="feature.id">
                    <button
                      @click="activeSection = feature.id"
                      :class="cn(
                        'text-onyx-400/80 hover:bg-onyx-900/50 hover:text-gold-400 flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors',
                        activeSection === feature.id && 'bg-onyx-900/50 !text-gold-400 font-medium'
                      )"
                    >
                      <span class="flex-1 min-w-0">{{ t(feature.label) }}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        <div class="max-w-3xl mx-auto px-8 py-12">
          <!-- Getting Started -->
          <div v-if="activeSection === 'getting-started'" class="space-y-8">
            <div class="space-y-4">
              <h1 class="text-4xl font-bold text-onyx-100 tracking-tight">{{ t('docs.gettingStartedTitle') }}</h1>
              <p class="text-lg text-onyx-400 leading-relaxed">{{ t('docs.gettingStartedDesc') }}</p>
            </div>

            <div class="space-y-6 mt-8">
              <h2 class="text-2xl font-semibold text-onyx-100">Quick Start</h2>
              <ul class="space-y-3 list-disc list-inside">
                <li v-for="(step, index) in tArray('docs.gettingStartedSteps')" :key="index" class="text-onyx-300 leading-relaxed">
                  <template v-if="step.includes('info button')">
                    <span v-for="(part, i) in step.split('(ℹ️)')" :key="i" class="inline">
                      <template v-if="i > 0">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 mx-0.5"
                          style="vertical-align: middle; display: inline-flex;"
                          tabindex="-1"
                        >
                          <Info class="w-4 h-4" />
                        </button>
                      </template>
                      <span class="inline">{{ part }}</span>
                    </span>
                  </template>
                  <template v-else>
                    {{ step }}
                  </template>
                </li>
              </ul>
            </div>
          </div>

          <!-- Features Overview -->
          <div v-if="activeSection === 'features'" class="space-y-8">
            <div class="space-y-4">
              <h1 class="text-4xl font-bold text-onyx-100 tracking-tight">{{ t('docs.featuresTitle') }}</h1>
              <p class="text-lg text-onyx-400 leading-relaxed">{{ t('docs.featuresDesc') }}</p>
            </div>

            <div class="grid gap-4 mt-8">
              <div
                v-for="feature in featureSections"
                :key="feature.id"
                @click="activeSection = feature.id"
                class="p-5 rounded-lg border border-onyx-800/50 bg-onyx-900/20 hover:bg-onyx-900/40 hover:border-onyx-700/50 transition-all cursor-pointer group"
              >
                <div class="flex gap-4">
                  <div class="w-8 h-8 flex items-center justify-center rounded-md bg-gold-500/10 group-hover:bg-gold-500/20 transition-colors flex-shrink-0">
                    <component :is="feature.icon" class="w-4 h-4 text-gold-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-medium text-onyx-100 leading-tight group-hover:text-gold-400 transition-colors">
                        {{ t(feature.label) }}
                      </h3>
                      <span v-if="feature.id === 'multi-account-manager'" class="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                        {{ t('common.beta') }}
                      </span>
                    </div>
                    <p class="text-sm text-onyx-400 leading-relaxed line-clamp-2">
                      {{ getFeatureDesc(feature.id) }}
                    </p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-onyx-600 group-hover:text-gold-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </div>
            </div>
          </div>

          <!-- Individual Feature Pages -->
          <template v-for="feature in featureSections" :key="feature.id">
            <div v-if="activeSection === feature.id" class="space-y-8">
              <div class="space-y-4">
                <h1 class="text-4xl font-bold text-onyx-100 tracking-tight">{{ t(feature.label) }}</h1>
              </div>

              <!-- Grid layout matching features overview -->
              <div class="grid gap-4">
                <div class="p-5 rounded-lg border border-onyx-800/50 bg-onyx-900/20">
                  <div class="flex gap-4">
                    <div class="w-8 h-8 flex items-center justify-center rounded-md bg-gold-500/10 flex-shrink-0">
                      <component :is="feature.icon" class="w-4 h-4 text-gold-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 class="text-lg font-medium text-onyx-100 leading-tight">
                          {{ t(feature.label) }}
                        </h3>
                        <span v-if="feature.id === 'multi-account-manager'" class="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          {{ t('common.beta') }}
                        </span>
                      </div>
                      <p class="text-sm text-onyx-400 leading-relaxed">
                        {{ getFeatureDesc(feature.id) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Token Limit Note -->
              <div v-if="feature.id === 'token-limit'" class="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <div class="flex items-start gap-3">
                  <Info class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <p class="text-sm text-yellow-200 leading-relaxed">
                      {{ t('docs.tokenLimitNote') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Troubleshooting -->
          <div v-if="activeSection === 'troubleshooting'" class="space-y-8">
            <div class="space-y-4">
              <h1 class="text-4xl font-bold text-onyx-100 tracking-tight">{{ t('docs.troubleshootingTitle') }}</h1>
              <p class="text-lg text-onyx-400 leading-relaxed">Common issues and their solutions.</p>
            </div>

            <div class="space-y-6 mt-8">
              <!-- Workbench File Not Found -->
              <div 
                :class="cn(
                  'p-5 rounded-lg border bg-onyx-900/20 transition-all duration-300',
                  workbenchFixSuccess 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-onyx-800/50'
                )"
              >
                <div class="space-y-4">
                  <div class="flex items-start gap-4">
                    <div 
                      :class="cn(
                        'w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0 transition-all duration-300',
                        workbenchFixSuccess 
                          ? 'bg-green-500/10' 
                          : 'bg-yellow-500/10'
                      )"
                    >
                      <CheckCircle2 
                        v-if="workbenchFixSuccess" 
                        class="w-4 h-4 text-green-400" 
                      />
                      <Wrench 
                        v-else 
                        class="w-4 h-4 text-yellow-400" 
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 
                          :class="cn(
                            'text-lg font-medium leading-tight transition-colors duration-300',
                            workbenchFixSuccess ? 'text-green-400' : 'text-onyx-100'
                          )"
                        >
                          {{ t('docs.workbenchFileNotFound.title') }}
                        </h3>
                        <div 
                          v-if="workbenchFixSuccess" 
                          class="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap"
                        >
                          {{ t('common.success') }}
                        </div>
                      </div>
                      <p class="text-sm text-onyx-400 leading-relaxed mb-4 max-w-2xl">
                        {{ t('docs.workbenchFileNotFound.description') }}
                      </p>
                      <div v-if="!workbenchFixSuccess" ref="fixContainerRef" class="flex items-center gap-3 min-w-0 w-full">
                        <div ref="fixButtonRef" class="flex-shrink-0">
                          <Button
                            variant="gold"
                            @click="handleFixWorkbench"
                            :loading="fixingWorkbench"
                            :disabled="fixingWorkbench"
                            class="whitespace-nowrap"
                          >
                            <span class="fix-button-text">{{ t('docs.workbenchFileNotFound.button') }}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Cursor Wrong Location -->
              <div 
                :class="cn(
                  'p-5 rounded-lg border bg-onyx-900/20 transition-all duration-300',
                  locationFixSuccess 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : 'border-onyx-800/50'
                )"
              >
                <div class="space-y-4">
                  <div class="flex items-start gap-4">
                    <div 
                      :class="cn(
                        'w-8 h-8 flex items-center justify-center rounded-md flex-shrink-0 transition-all duration-300',
                        locationFixSuccess 
                          ? 'bg-green-500/10' 
                          : 'bg-yellow-500/10'
                      )"
                    >
                      <CheckCircle2 
                        v-if="locationFixSuccess" 
                        class="w-4 h-4 text-green-400" 
                      />
                      <Wrench 
                        v-else 
                        class="w-4 h-4 text-yellow-400" 
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <h3 
                          :class="cn(
                            'text-lg font-medium leading-tight transition-colors duration-300',
                            locationFixSuccess ? 'text-green-400' : 'text-onyx-100'
                          )"
                        >
                          {{ t('docs.cursorWrongLocation.title') }}
                        </h3>
                        <div 
                          v-if="locationFixSuccess" 
                          class="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap"
                        >
                          {{ t('common.success') }}
                        </div>
                      </div>
                      <p class="text-sm text-onyx-400 leading-relaxed mb-4 max-w-2xl">
                        {{ t('docs.cursorWrongLocation.description') }}
                      </p>
                      <div v-if="!locationFixSuccess" ref="locationContainerRef" class="flex items-center gap-3 min-w-0 w-full">
                        <div ref="locationButtonRef" class="flex-shrink-0">
                          <Button
                            variant="gold"
                            @click="handleFixLocation"
                            :loading="fixingLocation"
                            :disabled="fixingLocation"
                            class="whitespace-nowrap"
                          >
                            <span class="fix-button-text">{{ t('docs.cursorWrongLocation.button') }}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FAQ -->
          <div v-if="activeSection === 'faq'" class="space-y-8">
            <div class="space-y-4">
              <h1 class="text-4xl font-bold text-onyx-100 tracking-tight">{{ t('docs.faqTitle') }}</h1>
            </div>

            <div class="space-y-2 mt-8">
              <div v-for="i in 5" :key="i" class="border border-onyx-800/50 rounded-lg overflow-hidden">
                <button
                  @click="toggleFaq(i)"
                  class="w-full flex items-center justify-between p-4 text-left hover:bg-onyx-900/30 transition-colors"
                >
                  <h3 class="text-base font-medium text-onyx-100 pr-4">{{ t(`docs.faqQ${i}`) }}</h3>
                  <component 
                    :is="expandedFaq === i ? ChevronDown : ChevronRight" 
                    class="w-4 h-4 text-onyx-500 flex-shrink-0 transition-all duration-200"
                  />
                </button>
                <div 
                  v-if="expandedFaq === i"
                  class="px-4 pb-4 pt-0"
                >
                  <p class="text-sm text-onyx-400 leading-relaxed">{{ t(`docs.faqA${i}`) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.prose {
  color: var(--color-onyx-300);
}

.prose p {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
