import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import Docs from './views/DocsStandalone.vue'
import './lib/colors'
import './assets/index.css'

import en from './locales/en.json'
import zh_cn from './locales/zh_cn.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    zh_cn
  }
})

const app = createApp(Docs)
app.use(i18n)
app.mount('#app')

