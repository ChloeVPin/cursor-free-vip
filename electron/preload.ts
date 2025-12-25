import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  docsMinimize: () => ipcRenderer.invoke('docs:minimize'),
  docsMaximize: () => ipcRenderer.invoke('docs:maximize'),
  docsClose: () => ipcRenderer.invoke('docs:close'),
  
  getPlatform: () => ipcRenderer.invoke('system:getPlatform'),
  isAdmin: () => ipcRenderer.invoke('system:isAdmin'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url: string) => ipcRenderer.invoke('system:openExternal', url),
  openPath: (path: string) => ipcRenderer.invoke('system:openPath', path),
  saveScreenshot: (imageData: string) => ipcRenderer.invoke('system:saveScreenshot', imageData),
  openDocs: () => ipcRenderer.invoke('docs:open'),
  
  getCursorPaths: () => ipcRenderer.invoke('paths:getCursorPaths'),
  getConfigDir: () => ipcRenderer.invoke('paths:getConfigDir'),
  
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config: object) => ipcRenderer.invoke('config:save', config),
  
  loadColorConfig: () => ipcRenderer.invoke('colors:load'),
  saveColorConfig: (colors: object) => ipcRenderer.invoke('colors:save', colors),
  
  resetMachineIds: () => ipcRenderer.invoke('machine:resetIds'),
  
  quitCursor: () => ipcRenderer.invoke('cursor:quit'),
  totallyReset: () => ipcRenderer.invoke('cursor:totallyReset'),
  
  disableAutoUpdate: () => ipcRenderer.invoke('update:disable'),
  
  fixWorkbenchFile: () => ipcRenderer.invoke('fix:workbenchFile'),
  fixCursorLocation: () => ipcRenderer.invoke('fix:cursorLocation'),
  
  bypassTokenLimit: () => ipcRenderer.invoke('token:bypass'),
  
  getAccountInfo: () => ipcRenderer.invoke('account:getInfo'),
  getSubscriptionInfo: () => ipcRenderer.invoke('account:getSubscriptionInfo'),
  updateAuth: (data: { email?: string; accessToken?: string; refreshToken?: string }) => 
    ipcRenderer.invoke('account:updateAuth', data),
  
  getAccounts: () => ipcRenderer.invoke('accounts:getAccounts'),
  getAccountsFromFile: (filePath: string) => ipcRenderer.invoke('accounts:getAccountsFromFile', filePath),
  createAccount: (data: { name: string; email: string; accessToken: string; refreshToken?: string; machineId?: string; devDeviceId?: string }, targetFilePath?: string) => 
    ipcRenderer.invoke('accounts:createAccount', data, targetFilePath),
  importAccounts: () => ipcRenderer.invoke('accounts:importAccounts'),
  switchAccount: (accountId: string) => ipcRenderer.invoke('accounts:switchAccount', accountId),
  deleteAccount: (accountId: string, targetFilePath?: string) => ipcRenderer.invoke('accounts:deleteAccount', accountId, targetFilePath),
  getAccountsFilePath: () => ipcRenderer.invoke('accounts:getAccountsFilePath'),
  
  onLog: (callback: (message: string) => void) => {
    const handler = (_event: any, message: string) => callback(message)
    ipcRenderer.on('log:message', handler)
    return () => ipcRenderer.removeListener('log:message', handler)
  }
})

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      docsMinimize: () => Promise<void>
      docsMaximize: () => Promise<void>
      docsClose: () => Promise<void>
      getPlatform: () => Promise<string>
      isAdmin: () => Promise<boolean>
      getAppVersion: () => Promise<string>
      openExternal: (url: string) => Promise<void>
      openPath: (path: string) => Promise<{ success: boolean; error?: string }>
      saveScreenshot: (imageData: string) => Promise<{ success: boolean; path?: string; error?: string }>
      openDocs: () => Promise<void>
      getCursorPaths: () => Promise<{
        storagePath: string
        sqlitePath: string
        cursorPath: string
        machineIdPath: string
      }>
      getConfigDir: () => Promise<string>
      loadConfig: () => Promise<Record<string, any>>
      saveConfig: (config: object) => Promise<boolean>
      loadColorConfig: () => Promise<Record<string, any> | null>
      saveColorConfig: (colors: object) => Promise<boolean>
      resetMachineIds: () => Promise<{ success: boolean; logs: string[]; newIds?: Record<string, string>; error?: string }>
      quitCursor: () => Promise<{ success: boolean; logs: string[] }>
      totallyReset: () => Promise<{ success: boolean; logs: string[]; error?: string }>
      disableAutoUpdate: () => Promise<{ success: boolean; logs: string[]; error?: string }>
      fixWorkbenchFile: () => Promise<{ success: boolean; logs: string[]; error?: string }>
      fixCursorLocation: () => Promise<{ success: boolean; logs: string[]; error?: string; alreadyFixed?: boolean }>
      bypassTokenLimit: () => Promise<{ success: boolean; logs: string[]; error?: string }>
      getAccountInfo: () => Promise<{
        email: string | null
        token: string | null
        machineId?: string | null
        devDeviceId?: string | null
      }>
      getSubscriptionInfo: () => Promise<{
        success: boolean
        subscriptionType: string | null
        daysRemaining: number | null
      }>
      updateAuth: (data: { email?: string; accessToken?: string; refreshToken?: string }) => 
        Promise<{ success: boolean; logs: string[]; error?: string }>
      getAccounts: () => Promise<{ success: boolean; accounts: any[]; error?: string }>
      getAccountsFromFile: (filePath: string) => Promise<{ success: boolean; accounts: any[]; error?: string }>
      createAccount: (data: { name: string; email: string; accessToken: string; refreshToken?: string; machineId?: string; devDeviceId?: string }, targetFilePath?: string) => 
        Promise<{ success: boolean; account?: any; error?: string }>
      importAccounts: () => Promise<{ success: boolean; filePath?: string; accounts?: any[]; imported?: number; error?: string }>
      switchAccount: (accountId: string) => Promise<{ success: boolean; logs: string[]; error?: string }>
      deleteAccount: (accountId: string, targetFilePath?: string) => Promise<{ success: boolean; error?: string }>
      getAccountsFilePath: () => Promise<string>
      onLog: (callback: (message: string) => void) => () => void
    }
  }
}

