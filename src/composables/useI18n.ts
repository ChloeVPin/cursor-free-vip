import { ref, computed } from 'vue'
import en from '@/locales/en.json'
import zhCn from '@/locales/zh_cn.json'
import ru from '@/locales/ru.json'

type LocaleMessages = typeof en
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

const locales: Record<string, DeepPartial<LocaleMessages>> = {
  en,
  zh_cn: zhCn,
  ru
}

const currentLocale = ref('en')

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path
    }
  }
  return result
}

export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (value: string) => {
      currentLocale.value = value
      localStorage.setItem('locale', value)
    }
  })

  const t = (key: string): string => {
    const messages = locales[currentLocale.value] || locales.en
    return getNestedValue(messages, key)
  }

  const tArray = (key: string): string[] => {
    const messages = locales[currentLocale.value] || locales.en
    const value = getNestedValue(messages, key)
    if (Array.isArray(value)) {
      return value
    }
    return []
  }

  const availableLocales = Object.keys(locales)

  const localeNames: Record<string, string> = {
    en: 'English',
    zh_cn: '中文',
    ru: 'Русский'
  }

  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && locales[savedLocale]) {
    currentLocale.value = savedLocale
  }

  return {
    locale,
    t,
    tArray,
    availableLocales,
    localeNames
  }
}
