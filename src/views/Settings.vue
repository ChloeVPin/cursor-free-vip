<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import Card from '@/components/ui/Card.vue'
import { Settings as SettingsIcon, Globe, Shield } from 'lucide-vue-next'
import GithubIcon from '@/components/ui/GithubIcon.vue'
import Switch from '@/components/ui/Switch.vue'
import { useI18n } from '@/composables/useI18n'
import { useTextScaling } from '@/composables/useTextScaling'
import { usePrivacy } from '@/composables/usePrivacy'
import { appMeta } from '@/lib/theme'
import { cn } from '@/lib/utils'

const { t, locale, availableLocales, localeNames } = useI18n()
const { autoScaleText } = useTextScaling()
const { privacyEnabled } = usePrivacy()

const config = ref<Record<string, any>>({})
const appVersion = ref<string>(appMeta.version)

const openGithub = () => {
  if (window.electronAPI?.openExternal && appMeta.github) {
    window.electronAPI.openExternal(appMeta.github)
  }
}

const scaleSettingsText = () => {
  autoScaleText('.language-button-text', 120, 14)
  autoScaleText('.settings-description', 280, 12)
}

const loadConfig = async () => {
  try {
    config.value = await window.electronAPI.loadConfig()
    if (config.value.language && availableLocales.includes(config.value.language)) {
      locale.value = config.value.language
    }
  } catch (e) {
    console.error('Failed to load config:', e)
  }
}

const setLanguage = async (lang: string) => {
  locale.value = lang
  try {
    config.value.language = lang
    await window.electronAPI.saveConfig(config.value)
  } catch (e) {
    console.error('Failed to save config:', e)
  }
}

onMounted(async () => {
  await loadConfig()
  try {
    appVersion.value = await window.electronAPI.getAppVersion()
  } catch (e) {
    console.error('Failed to get app version:', e)
  }
  await nextTick()
  scaleSettingsText()
})

watch(locale, async () => {
  await nextTick()
  scaleSettingsText()
})
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <h1>{{ t('settings.title') }}</h1>
      <p class="mt-1">{{ t('settings.subtitle') }}</p>
    </div>
    
    <!-- Privacy Settings -->
    <Card variant="glass" class="p-4">
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-gold-500/10">
          <Shield class="w-5 h-5 text-gold-400" />
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3>{{ t('settings.privacy') }}</h3>
              <p class="settings-description text-xs text-onyx-500 mt-1">{{ t('settings.privacyDesc') }}</p>
            </div>
            <Switch v-model="privacyEnabled" />
          </div>
        </div>
      </div>
    </Card>
    
    <!-- Language Settings -->
    <Card variant="glass" class="p-4">
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-gold-500/10">
          <Globe class="w-5 h-5 text-gold-400" />
        </div>
        <div class="flex-1">
          <h3>{{ t('settings.language') }}</h3>
          <p class="settings-description text-xs text-onyx-500 mt-1">{{ t('settings.languageDesc') }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="langCode in availableLocales"
              :key="langCode"
              @click="setLanguage(langCode)"
              :class="cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                locale === langCode
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'bg-onyx-800/50 text-onyx-400 hover:text-onyx-200'
              )"
            >
              <span class="language-button-text">{{ localeNames[langCode] || langCode }}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
    
    <!-- About Section -->
    <Card variant="glass" class="p-4">
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg bg-gold-500/10">
          <SettingsIcon class="w-5 h-5 text-gold-400" />
        </div>
        <div class="flex-1">
          <h3>{{ t('settings.about') }}</h3>
          <p class="settings-description text-xs text-onyx-500 mt-1">{{ t('settings.aboutDesc') }}</p>
          <div class="mt-3 text-xs text-onyx-400 space-y-1">
            <p>{{ t('settings.version') }}: {{ appVersion }}</p>
            <p class="settings-description">{{ appMeta.company }}</p>
          </div>
        </div>
      </div>
    </Card>
    
    <!-- Author -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h3 class="mb-2">{{ t('settings.author') }}</h3>
          <div class="flex items-center gap-3">
            <p class="text-sm text-onyx-300">{{ appMeta.author }}</p>
            <button
              @click="openGithub"
              type="button"
              class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
              :title="t('settings.viewOnGithub')"
            >
              <GithubIcon />
            </button>
          </div>
          <p class="text-xs text-onyx-600 mt-2">{{ t('settings.basedOn') }}</p>
        </div>
      </div>
    </Card>
  </div>
</template>
