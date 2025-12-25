<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import IdDisplay from '@/components/ui/IdDisplay.vue'
import {
  User,
  HardDrive,
  Fingerprint,
  Shield,
  RefreshCw,
  AlertTriangle
} from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import { useTextScaling } from '@/composables/useTextScaling'
import { usePrivacy } from '@/composables/usePrivacy'
import { cn } from '@/lib/utils'

const { t, locale } = useI18n()
const { autoScaleText } = useTextScaling()
const { maskSensitiveInfo } = usePrivacy()

const accountInfo = ref<{
  email: string | null
  token: string | null
  machineId: string | null
  devDeviceId: string | null
}>({ email: null, token: null, machineId: null, devDeviceId: null })

const cursorPaths = ref<{
  storagePath: string
  sqlitePath: string
  cursorPath: string
  machineIdPath: string
} | null>(null)

const isAdmin = ref(false)
const platform = ref('')
const loading = ref(true)

const scaleDashboardText = () => {
  autoScaleText('.dashboard-card-title', 200, 14)
  autoScaleText('.dashboard-description', 240, 12)
}

const refreshInfo = async () => {
  loading.value = true
  try {
    accountInfo.value = await window.electronAPI.getAccountInfo()
    cursorPaths.value = await window.electronAPI.getCursorPaths()
    isAdmin.value = await window.electronAPI.isAdmin()
    platform.value = await window.electronAPI.getPlatform()
  } catch (e) {
    console.error('Failed to load info:', e)
  }
  loading.value = false
}

onMounted(async () => {
  await refreshInfo()
  await nextTick()
  scaleDashboardText()
})

watch(locale, async () => {
  await nextTick()
  scaleDashboardText()
})

const platformName = (p: string) => {
  if (p === 'win32') return 'Windows'
  if (p === 'darwin') return 'macOS'
  return 'Linux'
}

const handlePathClick = async (path: string) => {
  if (!path || path === t('common.na')) return
  try {
    await window.electronAPI.openPath(path)
  } catch (err) {
    console.error('Failed to open path:', err)
  }
}
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1>{{ t('dashboard.title') }}</h1>
        <p class="mt-1">{{ t('dashboard.subtitle') }}</p>
      </div>
      <Button variant="ghost" size="sm" @click="refreshInfo" :loading="loading" :title="t('common.refresh')">
        <RefreshCw v-if="!loading" class="w-4 h-4" />
        {{ t('common.refresh') }}
      </Button>
    </div>
    
    <!-- Status Cards -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Account Status -->
      <Card variant="glass" class="p-4">
        <div class="flex items-start gap-4">
          <div :class="cn(
            'p-3 rounded-lg',
            accountInfo.token ? 'bg-success/10' : 'bg-error/10'
          )">
            <User :class="cn(
              'w-5 h-5',
              accountInfo.token ? 'text-success' : 'text-error'
            )" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="dashboard-card-title text-xs text-onyx-500 uppercase tracking-wide font-medium">{{ t('dashboard.account') }}</p>
            <p class="text-sm font-medium text-onyx-200 mt-1 truncate" :title="accountInfo.email || t('dashboard.notLoggedIn')">
              {{ maskSensitiveInfo(accountInfo.email || t('dashboard.notLoggedIn')) }}
            </p>
            <div class="flex items-center gap-1.5 mt-1">
              <span 
                :class="cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse',
                  accountInfo.token ? 'bg-success' : 'bg-error'
                )"
              />
              <span :class="cn(
                'text-xs font-medium',
                accountInfo.token ? 'text-success' : 'text-error'
              )">
                {{ accountInfo.token ? t('dashboard.activeSession') : t('dashboard.noSession') }}
              </span>
            </div>
          </div>
        </div>
      </Card>
      
      <!-- Admin Status -->
      <Card variant="glass" class="p-4">
        <div class="flex items-start gap-4">
          <div :class="cn(
            'p-3 rounded-lg',
            isAdmin ? 'bg-success/10' : 'bg-error/10'
          )">
            <Shield :class="cn(
              'w-5 h-5',
              isAdmin ? 'text-success' : 'text-error'
            )" />
          </div>
          <div class="flex-1">
            <p class="dashboard-card-title text-xs text-onyx-500 uppercase tracking-wide font-medium">{{ t('dashboard.privileges') }}</p>
            <p class="text-sm font-medium text-onyx-200 mt-1">
              {{ isAdmin ? t('dashboard.administrator') : t('dashboard.standardUser') }}
            </p>
            <p class="dashboard-description text-xs text-onyx-500 mt-1">
              {{ t('dashboard.platform') }}: {{ platformName(platform) }}
            </p>
          </div>
        </div>
      </Card>
    </div>
    
    <!-- Machine IDs -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <Fingerprint class="w-4 h-4 text-gold-400" />
        <h3 class="dashboard-card-title">{{ t('dashboard.machineIdentifiers') }}</h3>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <IdDisplay 
          :label="t('dashboard.machineId')" 
          :value="maskSensitiveInfo(accountInfo.machineId || '')" 
          :original-value="accountInfo.machineId"
        />
        <IdDisplay 
          :label="t('dashboard.deviceId')" 
          :value="maskSensitiveInfo(accountInfo.devDeviceId || '')" 
          :original-value="accountInfo.devDeviceId"
        />
      </div>
    </Card>
    
    <!-- Paths Info -->
    <Card variant="glass" class="p-4 flex-1 overflow-hidden">
      <div class="flex items-center gap-2 mb-4">
        <HardDrive class="w-4 h-4 text-gold-400" />
        <h3 class="dashboard-card-title">{{ t('dashboard.cursorPaths') }}</h3>
      </div>
      <div class="space-y-3 text-xs font-mono">
        <div class="flex items-start gap-2">
          <span class="text-onyx-500 w-20 flex-shrink-0">{{ t('dashboard.storage') }}</span>
          <span 
            v-if="cursorPaths?.storagePath"
            @click="handlePathClick(cursorPaths.storagePath)"
            class="text-gold-400 hover:text-gold-300 underline cursor-pointer break-all transition-colors"
            :data-original="cursorPaths.storagePath"
            :title="`Click to open: ${cursorPaths.storagePath}`"
          >
            {{ maskSensitiveInfo(cursorPaths.storagePath) }}
          </span>
          <span v-if="!cursorPaths?.storagePath" class="text-onyx-400 break-all">{{ t('common.na') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-onyx-500 w-20 flex-shrink-0">{{ t('dashboard.database') }}</span>
          <span 
            v-if="cursorPaths?.sqlitePath"
            @click="handlePathClick(cursorPaths.sqlitePath)"
            class="text-gold-400 hover:text-gold-300 underline cursor-pointer break-all transition-colors"
            :data-original="cursorPaths.sqlitePath"
            :title="`Click to open: ${cursorPaths.sqlitePath}`"
          >
            {{ maskSensitiveInfo(cursorPaths.sqlitePath) }}
          </span>
          <span v-if="!cursorPaths?.sqlitePath" class="text-onyx-400 break-all">{{ t('common.na') }}</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-onyx-500 w-20 flex-shrink-0">{{ t('dashboard.install') }}</span>
          <span 
            v-if="cursorPaths?.cursorPath"
            @click="handlePathClick(cursorPaths.cursorPath)"
            class="text-gold-400 hover:text-gold-300 underline cursor-pointer break-all transition-colors"
            :data-original="cursorPaths.cursorPath"
            :title="`Click to open: ${cursorPaths.cursorPath}`"
          >
            {{ maskSensitiveInfo(cursorPaths.cursorPath) }}
          </span>
          <span v-if="!cursorPaths?.cursorPath" class="text-onyx-400 break-all">{{ t('common.na') }}</span>
        </div>
      </div>
    </Card>
    
    <!-- Warning Banner -->
    <div v-if="!isAdmin && platform === 'win32'" class="rounded-lg p-4 flex items-center gap-3 bg-gold-500/5 border border-gold-500/20">
      <AlertTriangle class="w-5 h-5 text-gold-400 flex-shrink-0" />
      <div class="flex-1">
        <p class="dashboard-description text-sm text-gold-300 font-medium">{{ t('dashboard.adminWarning') }}</p>
        <p class="dashboard-description text-xs text-gold-400/70 mt-0.5">{{ t('dashboard.adminWarningDesc') }}</p>
      </div>
    </div>
  </div>
</template>
