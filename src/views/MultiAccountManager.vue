<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { Users, Plus, Download, Upload, Trash2, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-vue-next'
import { useI18n } from '@/composables/useI18n'
import InfoModal from '@/components/ui/InfoModal.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogContent from '@/components/ui/DialogContent.vue'
import DialogHeader from '@/components/ui/DialogHeader.vue'
import DialogTitle from '@/components/ui/DialogTitle.vue'
import DialogClose from '@/components/ui/DialogClose.vue'
import { usePrivacy } from '@/composables/usePrivacy'

const { t } = useI18n()
const { maskSensitiveInfo } = usePrivacy()

const cursorPaths = ref<{ storagePath: string; sqlitePath: string } | null>(null)

onMounted(async () => {
  try {
    const paths = await window.electronAPI.getCursorPaths()
    cursorPaths.value = {
      storagePath: paths.storagePath,
      sqlitePath: paths.sqlitePath
    }
  } catch (error) {
    console.error('Failed to get Cursor paths:', error)
  }
  
  loadAccounts()
})

const props = defineProps<{
  logs: string[]
}>()

const emit = defineEmits<{
  log: [message: string]
  'clear-logs': []
}>()

interface Account {
  id: string
  name: string
  email: string
  accessToken: string
  refreshToken?: string
  machineId?: string
  devDeviceId?: string
  createdAt: string
}

const accounts = ref<Account[]>([])
const loading = ref(false)
const accountsFilePath = ref('')
const importedFilePath = ref<string | null>(null)
const currentAccountEmail = ref<string | null>(null)

const showCreateDialog = ref(false)

const newAccountName = ref('')
const newAccountEmail = ref('')
const newAccountToken = ref('')
const newAccountRefreshToken = ref('')
const creatingAccount = ref(false)
const createError = ref('')
const createSuccess = ref(false)

const importing = ref(false)

const showSwitchDialog = ref(false)
const accountToSwitch = ref<Account | null>(null)
const switching = ref(false)

const showDeleteDialog = ref(false)
const accountToDelete = ref<Account | null>(null)
const deleting = ref(false)

const showAccountInfo = ref<string | null>(null)

const showInfoDialog = ref(false)

const showFieldInfoDialog = ref(false)
const currentFieldInfo = ref<{ title: string; content: string } | null>(null)

const openFieldInfo = (field: 'accountName' | 'email' | 'accessToken' | 'refreshToken') => {
  const fieldInfo = {
    accountName: {
      title: t('multiAccount.accountName'),
      content: t('multiAccount.accountNameInfo')
    },
    email: {
      title: t('multiAccount.email'),
      content: t('multiAccount.emailInfo')
    },
    accessToken: {
      title: t('multiAccount.accessToken'),
      content: t('multiAccount.accessTokenInfo')
    },
    refreshToken: {
      title: t('multiAccount.refreshToken'),
      content: t('multiAccount.refreshTokenInfo')
    }
  }
  currentFieldInfo.value = fieldInfo[field]
  showFieldInfoDialog.value = true
}

const openAccountsFilePath = async () => {
  if (!accountsFilePath.value) {
    console.warn('Accounts file path is not set')
    return
  }
  try {
    console.log('Opening path:', accountsFilePath.value)
    const result = await window.electronAPI.openPath(accountsFilePath.value)
    if (!result.success) {
      console.error('Failed to open path:', result.error)
    } else {
      console.log('Path opened successfully')
    }
  } catch (error) {
    console.error('Failed to open path:', error)
  }
}

const handleFileClick = async (fileName: string) => {
  if (!cursorPaths.value) return
  
  let pathToOpen = ''
  if (fileName === 'storage.json') {
    pathToOpen = cursorPaths.value.storagePath
  } else if (fileName === 'state.vscdb') {
    pathToOpen = cursorPaths.value.sqlitePath
  }
  
  if (pathToOpen) {
    try {
      await window.electronAPI.openPath(pathToOpen)
    } catch (error) {
      console.error('Failed to open path:', error)
    }
  }
}

const renderInfoContent = (content: string) => {
  if (!content) return ''
  
  const fileMap: Record<string, string> = {
    'storage.json': 'storage.json',
    'state.vscdb': 'state.vscdb'
  }
  
  let html = content
  for (const [fileName, displayName] of Object.entries(fileMap)) {
    const regex = new RegExp(`(${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    html = html.replace(regex, (match) => {
      return `<span class="text-gold-400 underline cursor-pointer hover:text-gold-300" data-file="${fileName}">${match}</span>`
    })
  }
  
  return html
}

const loadAccounts = async () => {
  loading.value = true
  try {
    if (importedFilePath.value) {
      const result = await window.electronAPI.getAccountsFromFile(importedFilePath.value)
      if (result.success) {
        accounts.value = result.accounts || []
      }
      accountsFilePath.value = importedFilePath.value
    } else {
      const result = await window.electronAPI.getAccounts()
      if (result.success) {
        accounts.value = result.accounts || []
      }
      
      const path = await window.electronAPI.getAccountsFilePath()
      accountsFilePath.value = path
    }
    
    const accountInfo = await window.electronAPI.getAccountInfo()
    currentAccountEmail.value = accountInfo.email
  } catch (e: any) {
    emit('log', `Error loading accounts: ${e.message}`)
  }
  loading.value = false
}

const createAccount = async () => {
  
  if (!newAccountName.value || !newAccountEmail.value || !newAccountToken.value) {
    createError.value = t('multiAccount.fillAllFields')
    return
  }
  
  creatingAccount.value = true
  createError.value = ''
  createSuccess.value = false
  
  try {
    const result = await window.electronAPI.createAccount({
      name: newAccountName.value,
      email: newAccountEmail.value,
      accessToken: newAccountToken.value,
      refreshToken: newAccountRefreshToken.value || undefined
    }, importedFilePath.value || undefined)
    
    
    if (result.success) {
      createSuccess.value = true
      newAccountName.value = ''
      newAccountEmail.value = ''
      newAccountToken.value = ''
      newAccountRefreshToken.value = ''
      await loadAccounts()
      setTimeout(() => {
        showCreateDialog.value = false
        createSuccess.value = false
      }, 1500)
    } else {
      createError.value = result.error || t('multiAccount.createError')
      console.error('createAccount failed', result.error)
    }
  } catch (e: any) {
    createError.value = e.message || t('multiAccount.createError')
    console.error('createAccount error', e)
  }
  
  creatingAccount.value = false
}

const handleImport = async () => {
  importing.value = true
  emit('clear-logs')
  emit('log', t('multiAccount.importing'))
  
  try {
    const result = await window.electronAPI.importAccounts()
    
    if (result.success && result.filePath) {
      importedFilePath.value = result.filePath
      accountsFilePath.value = result.filePath
      
      if (result.accounts) {
        accounts.value = result.accounts
      } else {
        await loadAccounts()
      }
      
      emit('log', `${t('multiAccount.importSuccess')} (${result.imported} imported)`)
      emit('log', t('multiAccount.importedFileNote'))
    } else {
      if (result.error !== 'No file selected') {
        emit('log', result.error || t('multiAccount.importError'))
      }
    }
  } catch (e: any) {
    emit('log', `Error: ${e.message}`)
  }
  
  importing.value = false
}


const confirmSwitchAccount = (account: Account) => {
  accountToSwitch.value = account
  showSwitchDialog.value = true
}

const switchAccount = async () => {
  if (!accountToSwitch.value) return
  
  switching.value = true
  emit('clear-logs')
  emit('log', t('multiAccount.switchingAccount'))
  
  try {
    emit('log', t('multiAccount.resettingCursor'))
    const resetResult = await window.electronAPI.totallyReset()
    if (resetResult.success && resetResult.logs) {
      resetResult.logs.forEach(log => emit('log', log))
      emit('log', t('multiAccount.resetComplete'))
    } else if (!resetResult.success) {
      emit('log', resetResult.error || 'Reset failed')
    }
    
    emit('log', t('multiAccount.applyingAccount'))
    const switchResult = await window.electronAPI.switchAccount(accountToSwitch.value.id)
    
    if (switchResult.success) {
      switchResult.logs.forEach(log => emit('log', log))
      emit('log', '')
      emit('log', t('multiAccount.switchSuccess'))
      await loadAccounts()
      showSwitchDialog.value = false
    } else {
      emit('log', switchResult.error || t('multiAccount.switchError'))
    }
  } catch (e: any) {
    emit('log', `Error: ${e.message}`)
  }
  
  switching.value = false
}

const confirmDeleteAccount = (account: Account) => {
  accountToDelete.value = account
  showDeleteDialog.value = true
}

const deleteAccount = async () => {
  if (!accountToDelete.value) return
  
  deleting.value = true
  
  try {
    const targetPath = importedFilePath.value || undefined
    const result = await window.electronAPI.deleteAccount(accountToDelete.value.id, targetPath)
    if (result.success) {
      await loadAccounts()
      showDeleteDialog.value = false
    } else {
      emit('log', result.error || t('multiAccount.deleteError'))
    }
  } catch (e: any) {
    emit('log', `Error: ${e.message}`)
  }
  
  deleting.value = false
}

onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <div class="min-h-full flex flex-col gap-6">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-2">
        <h1>{{ t('multiAccount.title') }}</h1>
        <span class="px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
          {{ t('common.beta') }}
        </span>
      </div>
      <p class="mt-1">{{ t('multiAccount.subtitle') }}</p>
    </div>
    
    <!-- Info Card -->
    <Card variant="glass" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gold-500/10">
            <Users class="w-5 h-5 text-gold-400" />
          </div>
          <h3 class="text-sm font-medium text-onyx-200">{{ t('multiAccount.whatThisDoes') }}</h3>
        </div>

        <button
          @click="showInfoDialog = true"
          type="button"
          class="inline-flex items-center justify-center h-8 w-8 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          :title="t('common.whatThisDoes')"
        >
          <Info class="w-4 h-4" />
        </button>
        
        <InfoModal :open="showInfoDialog" :title="t('multiAccount.whatThisDoes')" class="max-w-2xl" @update:open="showInfoDialog = $event">
          <div class="space-y-4 text-sm text-onyx-300">
            <p>{{ t('multiAccount.features') }}</p>
            <div class="p-3 bg-onyx-900/50 rounded-lg border border-onyx-800">
              <p class="text-xs text-onyx-400 mb-2">{{ t('multiAccount.fileLocation') }}:</p>
              <button
                @click="openAccountsFilePath"
                class="text-xs text-gold-400 break-all text-left hover:text-gold-300 hover:underline transition-colors cursor-pointer w-full"
                type="button"
              >
                {{ maskSensitiveInfo(accountsFilePath) }}
              </button>
            </div>
            <p class="text-xs text-onyx-500">{{ t('multiAccount.dataSafety') }}</p>
          </div>
        </InfoModal>
      </div>
    </Card>
    
    <!-- Actions -->
    <div class="flex items-center gap-3">
      <Button
        @click="showCreateDialog = true"
        variant="default"
        type="button"
        class="flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        {{ t('multiAccount.createAccount') }}
      </Button>
      <Button
        @click="handleImport"
        variant="outline"
        class="flex items-center gap-2"
        :disabled="importing"
      >
        <Upload class="w-4 h-4" />
        {{ t('multiAccount.import') }}
      </Button>
      <Button
        @click="loadAccounts"
        variant="ghost"
        size="icon"
        :disabled="loading"
        :title="t('common.refresh')"
      >
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
      </Button>
    </div>
    
    <!-- Accounts List (styled like LogOutput) -->
    <Card variant="glass" class="flex-1 flex flex-col min-h-0">
      <div class="flex items-center justify-between p-3 border-b border-onyx-800/50">
        <h3 class="text-sm font-medium text-onyx-200">{{ t('multiAccount.accountsList') }}</h3>
        <Button
          @click="loadAccounts"
          variant="ghost"
          size="icon"
          :disabled="loading"
          class="h-7 w-7"
          :title="t('common.refresh')"
        >
          <RefreshCw :class="['w-3.5 h-3.5', loading && 'animate-spin']" />
        </Button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-3">
        <div v-if="loading" class="flex items-center justify-center h-32">
          <RefreshCw class="w-6 h-6 text-onyx-500 animate-spin" />
        </div>
        <div v-else-if="accounts.length === 0" class="flex flex-col items-center justify-center h-32 text-onyx-500">
          <Users class="w-8 h-8 mb-2 opacity-50" />
          <p class="text-sm">{{ t('multiAccount.noAccounts') }}</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="account in accounts"
            :key="account.id"
            class="p-3 rounded-lg border border-onyx-800/50 bg-onyx-900/30 hover:bg-onyx-900/50 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-medium text-white truncate">{{ maskSensitiveInfo(account.email) }}</p>
                  <span
                    v-if="account.email === currentAccountEmail"
                    class="px-1.5 py-0.5 text-xs font-medium bg-success/10 text-success border border-success/20 rounded flex-shrink-0"
                  >
                    {{ t('multiAccount.current') }}
                  </span>
                </div>
                <p class="text-xs text-onyx-500">
                  {{ account.name }} • {{ new Date(account.createdAt).toLocaleDateString() }}
                </p>
              </div>
              <div class="flex items-center gap-1.5 ml-3 flex-shrink-0">
                <button
                  @click="showAccountInfo = showAccountInfo === account.id ? null : account.id"
                  type="button"
                  class="inline-flex items-center justify-center h-7 w-7 rounded-md text-onyx-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
                  :title="t('multiAccount.viewInfo')"
                >
                  <Info class="w-4 h-4" />
                </button>
                <button
                  @click="confirmDeleteAccount(account)"
                  type="button"
                  class="inline-flex items-center justify-center h-7 w-7 rounded-md text-onyx-400 hover:text-error hover:bg-error/10 transition-colors"
                  :disabled="deleting"
                  :title="t('multiAccount.delete')"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <!-- Account Info Expanded -->
            <div
              v-if="showAccountInfo === account.id"
              class="mt-3 pt-3 border-t border-onyx-800/50 space-y-2"
            >
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.accountName') }}</p>
                  <p class="text-onyx-200 font-mono">{{ account.name }}</p>
                </div>
                <div>
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.email') }}</p>
                  <p class="text-onyx-200 font-mono break-all">{{ maskSensitiveInfo(account.email) }}</p>
                </div>
                <div>
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.accessToken') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px] break-all">{{ maskSensitiveInfo(account.accessToken.substring(0, 50) + '...') }}</p>
                </div>
                <div v-if="account.refreshToken">
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.refreshToken') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px] break-all">{{ maskSensitiveInfo(account.refreshToken.substring(0, 50) + '...') }}</p>
                </div>
                <div v-if="account.machineId">
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.machineId') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px] break-all">{{ maskSensitiveInfo(account.machineId) }}</p>
                </div>
                <div v-if="account.devDeviceId">
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.deviceId') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px] break-all">{{ maskSensitiveInfo(account.devDeviceId) }}</p>
                </div>
                <div>
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.created') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px]">{{ new Date(account.createdAt).toLocaleString() }}</p>
                </div>
                <div>
                  <p class="text-onyx-500 mb-0.5">{{ t('multiAccount.accountId') }}</p>
                  <p class="text-onyx-200 font-mono text-[10px] break-all">{{ maskSensitiveInfo(account.id) }}</p>
                </div>
              </div>
              <div v-if="account.email !== currentAccountEmail" class="pt-2">
                <Button
                  @click="confirmSwitchAccount(account)"
                  variant="outline"
                  size="sm"
                  :disabled="switching"
                  class="w-full"
                >
                  {{ t('multiAccount.switch') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
    
    <!-- Create Account Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('multiAccount.createAccount') }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 mt-6">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-onyx-200">
                {{ t('multiAccount.accountName') }}
              </label>
              <button
                @click="openFieldInfo('accountName')"
                type="button"
                class="flex items-center justify-center w-3.5 h-3.5 text-onyx-500 hover:text-gold-400 hover:bg-gold-500/10 rounded transition-colors"
                style="padding: 0; margin: 0; border: none; background: transparent; cursor: pointer;"
              >
                <Info class="w-3.5 h-3.5" style="display: block;" />
              </button>
            </div>
            <Input
              v-model="newAccountName"
              :placeholder="t('multiAccount.accountNamePlaceholder')"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-onyx-200">
                {{ t('multiAccount.email') }}
              </label>
              <button
                @click="openFieldInfo('email')"
                type="button"
                class="flex items-center justify-center w-3.5 h-3.5 text-onyx-500 hover:text-gold-400 hover:bg-gold-500/10 rounded transition-colors"
                style="padding: 0; margin: 0; border: none; background: transparent; cursor: pointer;"
              >
                <Info class="w-3.5 h-3.5" style="display: block;" />
              </button>
            </div>
            <Input
              v-model="newAccountEmail"
              type="email"
              :placeholder="t('multiAccount.emailPlaceholder')"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-onyx-200">
                {{ t('multiAccount.accessToken') }}
              </label>
              <button
                @click="openFieldInfo('accessToken')"
                type="button"
                class="flex items-center justify-center w-3.5 h-3.5 text-onyx-500 hover:text-gold-400 hover:bg-gold-500/10 rounded transition-colors"
                style="padding: 0; margin: 0; border: none; background: transparent; cursor: pointer;"
              >
                <Info class="w-3.5 h-3.5" style="display: block;" />
              </button>
            </div>
            <Input
              v-model="newAccountToken"
              type="password"
              :placeholder="t('multiAccount.tokenPlaceholder')"
            />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium text-onyx-200">
                {{ t('multiAccount.refreshToken') }} ({{ t('common.optional') }})
              </label>
              <button
                @click="openFieldInfo('refreshToken')"
                type="button"
                class="flex items-center justify-center w-3.5 h-3.5 text-onyx-500 hover:text-gold-400 hover:bg-gold-500/10 rounded transition-colors"
                style="padding: 0; margin: 0; border: none; background: transparent; cursor: pointer;"
              >
                <Info class="w-3.5 h-3.5" style="display: block;" />
              </button>
            </div>
            <Input
              v-model="newAccountRefreshToken"
              type="password"
              :placeholder="t('multiAccount.refreshTokenPlaceholder')"
            />
          </div>
          <div v-if="createError" class="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-error" />
            <p class="text-sm text-error">{{ createError }}</p>
          </div>
          <div v-if="createSuccess" class="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
            <CheckCircle class="w-4 h-4 text-success" />
            <p class="text-sm text-success">{{ t('multiAccount.createSuccess') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              @click.prevent="createAccount"
              type="button"
              variant="default"
              :disabled="creatingAccount"
              class="flex-1"
            >
              {{ creatingAccount ? t('common.creating') : t('common.create') }}
            </Button>
            <DialogClose :as-child="true">
              <Button variant="outline">{{ t('common.cancel') }}</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <!-- Switch Account Confirmation Dialog -->
    <Dialog v-model:open="showSwitchDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('multiAccount.switchAccount') }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <p class="text-sm text-onyx-300">
            {{ t('multiAccount.switchWarning') }}
          </p>
          <div class="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p class="text-sm text-warning">
              {{ t('multiAccount.switchResetWarning') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              @click="switchAccount"
              variant="default"
              :disabled="switching"
              class="flex-1"
            >
              {{ switching ? t('common.switching') : t('common.confirm') }}
            </Button>
            <DialogClose :as-child="true">
              <Button variant="outline">{{ t('common.cancel') }}</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <!-- Delete Account Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('multiAccount.deleteAccount') }}</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 mt-6">
          <p class="text-sm text-onyx-300">
            {{ t('multiAccount.deleteWarning') }}
          </p>
          <div class="flex items-center gap-3">
            <Button
              @click="deleteAccount"
              variant="destructive"
              :disabled="deleting"
              class="flex-1"
            >
              {{ deleting ? t('common.deleting') : t('common.delete') }}
            </Button>
            <DialogClose :as-child="true">
              <Button variant="outline">{{ t('common.cancel') }}</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    <!-- Field Info Dialog -->
    <InfoModal 
      v-if="currentFieldInfo"
      :open="showFieldInfoDialog" 
      :title="currentFieldInfo.title" 
      class="max-w-md"
      @update:open="showFieldInfoDialog = $event"
    >
      <p 
        class="text-sm text-onyx-300 leading-relaxed"
        v-html="renderInfoContent(currentFieldInfo.content)"
        @click="(e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target && target.dataset.file) {
            e.preventDefault()
            e.stopPropagation()
            handleFileClick(target.dataset.file)
          }
        }"
      ></p>
    </InfoModal>
  </div>
</template>

