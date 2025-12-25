<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
  LayoutDashboard,
  RefreshCw,
  Shield,
  Zap,
  Lock,
  Power,
  Settings,
  Trash2,
  KeyRound,
  BookOpen,
  Users
} from 'lucide-vue-next'
import CursorIcon from '@/components/ui/CursorIcon.vue'
import { useI18n } from '@/composables/useI18n'
import { useTextScaling } from '@/composables/useTextScaling'
import { usePrivacy } from '@/composables/usePrivacy'
import { appMeta } from '@/lib/theme'
import { cn } from '@/lib/utils'

const { t, locale } = useI18n()
const { autoScaleText } = useTextScaling()
const { maskSensitiveInfo } = usePrivacy()

const props = defineProps<{
  currentView: string
}>()

const emit = defineEmits<{
  navigate: [view: string]
}>()

const accountInfo = ref<{
  email: string | null
  token: string | null
}>({ email: null, token: null })

const subscriptionInfo = ref<{
  subscriptionType: string | null
  daysRemaining: number | null
}>({ subscriptionType: null, daysRemaining: null })

const appVersion = ref<string>(appMeta.version)

const menuItemsContainer = ref<HTMLElement | null>(null)
const activeIndicatorStyle = ref({ top: '0px', height: '0px' })

const menuItems = computed(() => [
  { id: 'dashboard', labelKey: 'menu.dashboard', icon: LayoutDashboard },
  { id: 'resetMachineId', labelKey: 'menu.resetMachineId', icon: RefreshCw },
  { id: 'manualAuth', labelKey: 'menu.manualAuth', icon: KeyRound },
  { id: 'multiAccountManager', labelKey: 'menu.multiAccountManager', icon: Users },
  { id: 'disableUpdate', labelKey: 'menu.disableUpdate', icon: Shield },
  { id: 'tokenBypass', labelKey: 'menu.tokenBypass', icon: Lock },
  { id: 'quitCursor', labelKey: 'menu.quitCursor', icon: Power },
  { id: 'totallyReset', labelKey: 'menu.totallyReset', icon: Trash2 },
  { id: 'docs', labelKey: 'menu.docs', icon: BookOpen },
  { id: 'settings', labelKey: 'menu.settings', icon: Settings },
])

const scaleMenuText = () => {
  if (menuItemsContainer.value) {
    const menuTexts = menuItemsContainer.value.querySelectorAll('.menu-item-text')
    menuTexts.forEach((textElement) => {
      autoScaleText('.menu-item-text', 160, 14)
    })
  }
}

onMounted(async () => {
  try {
    accountInfo.value = await window.electronAPI.getAccountInfo()
    appVersion.value = await window.electronAPI.getAppVersion()
    
    const subInfo = await window.electronAPI.getSubscriptionInfo()
    if (subInfo.success) {
      subscriptionInfo.value = {
        subscriptionType: subInfo.subscriptionType,
        daysRemaining: subInfo.daysRemaining
      }
    }
  } catch (e) {
    console.error('Failed to get account info:', e)
  }

  await nextTick()
  scaleMenuText()
  updateActiveIndicator()
})

watch(locale, async () => {
  await nextTick()
  scaleMenuText()
})

const updateActiveIndicator = () => {
  if (!menuItemsContainer.value) return
  
  const activeButton = menuItemsContainer.value.querySelector(`[data-menu-id="${props.currentView}"]`) as HTMLElement
  if (activeButton) {
    const top = activeButton.offsetTop
    const height = activeButton.offsetHeight
    
    activeIndicatorStyle.value = {
      top: `${top}px`,
      height: `${height}px`
    }
  } else {
    activeIndicatorStyle.value = {
      top: '0px',
      height: '0px'
    }
  }
}

watch(() => props.currentView, () => {
  nextTick(() => {
    updateActiveIndicator()
  })
})

watch(menuItemsContainer, () => {
  if (menuItemsContainer.value) {
    updateActiveIndicator()
    menuItemsContainer.value.addEventListener('scroll', updateActiveIndicator)
  }
}, { immediate: true })

const handleMenuClick = (itemId: string) => {
  if (itemId === 'docs') {
    if (window.electronAPI?.openDocs) {
      window.electronAPI.openDocs()
    } else {
      console.error('electronAPI.openDocs is not available')
    }
  } else {
    emit('navigate', itemId)
  }
}
</script>

<template>
  <aside class="w-64 border-r border-onyx-800/50 bg-onyx-950/50 backdrop-blur-sm flex flex-col">
    <!-- Account Info -->
    <div class="p-4 border-b border-onyx-800/50">
      <div class="rounded-lg p-3 bg-onyx-900/50 backdrop-blur-sm border border-onyx-800/50">
        <div class="flex items-center gap-3">
          <div 
            :class="cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              accountInfo.token 
                ? 'bg-gradient-to-br from-gold-400 to-gold-500' 
                : 'bg-gradient-to-br from-gold-600 to-gold-700 opacity-60'
            )"
          >
            <CursorIcon class="w-5 h-5 text-onyx-950" />
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <p class="text-sm font-medium text-white truncate cursor-help overflow-hidden text-ellipsis whitespace-nowrap" :title="accountInfo.email || t('dashboard.notLoggedIn')">
              {{ maskSensitiveInfo(accountInfo.email || t('dashboard.notLoggedIn')) }}
            </p>
            <p :class="cn(
              'text-xs font-medium',
              accountInfo.token ? 'text-gold-400' : 'text-gold-500'
            )">
              {{ accountInfo.token ? t('dashboard.activeSession') : t('dashboard.noSession') }}
            </p>
          </div>
        </div>
        <div v-if="subscriptionInfo.subscriptionType || subscriptionInfo.daysRemaining !== null" class="mt-2 pt-2 border-t border-onyx-800/30 space-y-1">
          <p v-if="subscriptionInfo.subscriptionType" class="text-xs text-onyx-400">
            <span class="text-onyx-500">{{ t('dashboard.subscription') }}:</span>
            <span class="text-onyx-300 ml-1">{{ subscriptionInfo.subscriptionType }}</span>
          </p>
          <p v-if="subscriptionInfo.daysRemaining !== null && subscriptionInfo.daysRemaining > 0" class="text-xs text-onyx-400">
            <span class="text-onyx-500">{{ t('dashboard.trialRemaining') }}:</span>
            <span class="text-gold-400 ml-1">{{ subscriptionInfo.daysRemaining }} {{ t('dashboard.days') }}</span>
          </p>
        </div>
      </div>
    </div>
    
    <!-- Navigation -->
    <nav ref="menuItemsContainer" class="flex-1 overflow-y-auto p-3 space-y-1 relative">
      <!-- Sliding Indicator -->
      <div
        class="absolute left-3 right-3 rounded-lg bg-gold-500/10 border border-gold-500/20 transition-all duration-300 ease-out pointer-events-none z-0"
        :style="activeIndicatorStyle"
      />
      
      <button
        v-for="item in menuItems"
        :key="item.id"
        :data-menu-id="item.id"
        @click="handleMenuClick(item.id)"
        :class="cn(
          'relative z-10 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
          props.currentView === item.id
            ? 'text-gold-400'
            : 'text-onyx-400 hover:text-onyx-200'
        )"
      >
        <component
          :is="item.icon"
          :class="cn(
            'w-4 h-4 flex-shrink-0',
            props.currentView === item.id ? 'text-gold-400' : 'text-onyx-500'
          )"
        />
        <span class="menu-item-text truncate">{{ t(item.labelKey) }}</span>
      </button>
    </nav>
    
    <!-- Footer -->
    <div class="p-4 border-t border-onyx-800/50">
      <div class="text-center">
        <p class="text-xs text-onyx-600">{{ appMeta.name }} v{{ appVersion }}</p>
      </div>
    </div>
  </aside>
</template>

