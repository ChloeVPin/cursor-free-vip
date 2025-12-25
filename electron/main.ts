import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync, statSync, chmodSync } from 'fs'
import { execSync } from 'child_process'
import { v4 as uuidv4 } from 'uuid'
import { createHash, randomBytes } from 'crypto'
import * as fs from 'fs-extra'
import { homedir } from 'os'

try {
  if (require('electron-squirrel-startup')) {
    app.quit()
  }
} catch {
}

let mainWindow: BrowserWindow | null = null
let docsWindow: BrowserWindow | null = null
let SQL: any = null

async function initSqlJs() {
  if (SQL) return SQL
  try {
    const initSqlJs = require('sql.js')
    SQL = await initSqlJs()
    return SQL
  } catch (err) {
    console.error('Failed to initialize sql.js:', err)
    return null
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: join(__dirname, process.platform === 'win32' ? '../public/icon.ico' : '../public/icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: false
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  await initSqlJs()
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================
// IPC Handlers - Window Controls
// ============================================

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

// ============================================
// IPC Handlers - System Info
// ============================================

ipcMain.handle('system:getPlatform', () => {
  return process.platform
})

ipcMain.handle('system:isAdmin', async () => {
  if (process.platform === 'win32') {
    try {
      execSync('net session', { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }
  return process.getuid?.() === 0
})

ipcMain.handle('system:openExternal', async (_, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion()
})

ipcMain.handle('system:openPath', async (_, path: string) => {
  try {
    let pathToOpen = path
    
    if (existsSync(path)) {
      try {
        const stats = statSync(path)
        if (stats.isFile()) {
          pathToOpen = dirname(path)
        }
      } catch {
        if (!path.endsWith('/') && !path.endsWith('\\') && path.includes('.')) {
          const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
          if (lastSlash > 0) {
            pathToOpen = path.substring(0, lastSlash)
          }
        }
      }
    } else {
      if (!path.endsWith('/') && !path.endsWith('\\') && path.includes('.')) {
        const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
        if (lastSlash > 0) {
          pathToOpen = path.substring(0, lastSlash)
        }
      }
    }
    
    await shell.openPath(pathToOpen)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('system:saveScreenshot', async (_, imageData: string) => {
  try {
    let downloadsPath: string
    const platform = process.platform
    
    if (platform === 'win32') {
      downloadsPath = join(process.env.USERPROFILE || homedir(), 'Downloads')
    } else if (platform === 'darwin') {
      downloadsPath = join(homedir(), 'Downloads')
    } else {
      downloadsPath = process.env.XDG_DOWNLOAD_DIR || join(homedir(), 'Downloads')
    }
    
    if (!existsSync(downloadsPath)) {
      mkdirSync(downloadsPath, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `cursor-free-vip-log-${timestamp}.png`
    const filePath = join(downloadsPath, filename)
    
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    writeFileSync(filePath, buffer)
    
    return { success: true, path: filePath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// ============================================
// IPC Handlers - Fixes
// ============================================

ipcMain.handle('fix:workbenchFile', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Starting workbench file fix...')
  
  try {
    const paths = getCursorPaths()
    const targetPath = join(paths.cursorPath, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    
    let sourcePath: string
    if (process.env.VITE_DEV_SERVER_URL) {
      sourcePath = join(process.cwd(), 'resources', 'fixes', 'workbench.desktop.main.js')
    } else {
      const appPath = app.getAppPath()
      sourcePath = join(appPath, 'resources', 'fixes', 'workbench.desktop.main.js')
      
      if (!existsSync(sourcePath)) {
        sourcePath = join(__dirname, '..', 'resources', 'fixes', 'workbench.desktop.main.js')
      }
    }
    
    if (!existsSync(sourcePath)) {
      sendLog(`[ERROR] Source file not found: ${sourcePath}`)
      sendLog(`[INFO] Please ensure the workbench.desktop.main.js file is in the resources/fixes folder`)
      return { success: false, logs, error: 'Source file not found' }
    }
    
    sendLog(`[INFO] Source file found: ${sourcePath}`)
    sendLog(`[INFO] Target path: ${targetPath}`)
    
    const targetDir = dirname(targetPath)
    if (!existsSync(targetDir)) {
      sendLog(`[INFO] Creating target directory: ${targetDir}`)
      await fs.ensureDir(targetDir)
    }
    
    if (existsSync(targetPath)) {
      sendLog(`[INFO] File exists, overwriting...`)
    }
    
    sendLog(`[INFO] Copying file...`)
    await fs.copy(sourcePath, targetPath)
    
    sendLog(`[OK] File copied successfully`)
    sendLog(`[OK] Workbench file fix completed`)
    
    return { success: true, logs }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

ipcMain.handle('fix:cursorLocation', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Starting Cursor location fix...')
  
  try {
    let sourcePath: string
    let targetPath: string
    
    if (process.platform === 'win32') {
      const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
      sourcePath = join(programFiles, 'Cursor')
      const localAppData = process.env.LOCALAPPDATA || ''
      targetPath = join(localAppData, 'Programs', 'Cursor')
      
      if (!existsSync(sourcePath)) {
        sendLog(`[INFO] Cursor not found in Program Files: ${sourcePath}`)
        sendLog(`[INFO] Checking if already in correct location...`)
        
        if (existsSync(targetPath)) {
          sendLog(`[OK] Cursor is already in the correct location: ${targetPath}`)
          return { success: true, logs, alreadyFixed: true }
        }
        
        sendLog(`[ERROR] Cursor installation not found in expected locations`)
        return { success: false, logs, error: 'Cursor installation not found' }
      }
      
      sendLog(`[INFO] Found Cursor in Program Files: ${sourcePath}`)
      sendLog(`[INFO] Target location: ${targetPath}`)
      
      if (existsSync(targetPath)) {
        sendLog(`[WARN] Target location already exists: ${targetPath}`)
        sendLog(`[INFO] Removing existing target...`)
        await fs.remove(targetPath)
      }
      
      const targetParent = dirname(targetPath)
      await fs.ensureDir(targetParent)
      
      sendLog(`[INFO] Moving Cursor folder...`)
      sendLog(`[INFO] This may take a few moments...`)
      
      await fs.move(sourcePath, targetPath)
      
      sendLog(`[OK] Cursor folder moved successfully`)
      sendLog(`[OK] Location fix completed`)
      
    } else if (process.platform === 'darwin') {
      const systemPath = '/Applications/Cursor.app'
      const userPath = join(process.env.HOME || '', 'Applications', 'Cursor.app')
      
      if (existsSync(systemPath) && !existsSync(userPath)) {
        sendLog(`[INFO] Found Cursor in system location: ${systemPath}`)
        sendLog(`[INFO] Moving to user Applications folder...`)
        
        await fs.ensureDir(dirname(userPath))
        await fs.move(systemPath, userPath)
        
        sendLog(`[OK] Cursor moved to user Applications folder`)
      } else if (existsSync(userPath)) {
        sendLog(`[OK] Cursor is already in user location`)
      } else {
        sendLog(`[INFO] Cursor installation not found in expected locations`)
        return { success: false, logs, error: 'Cursor installation not found' }
      }
      
      sendLog(`[OK] Location fix completed`)
      
    } else {
      const systemPaths = [
        '/opt/Cursor',
        '/usr/share/cursor',
        '/usr/local/share/cursor'
      ]
      
      const home = process.env.HOME || ''
      const userPath = join(home, '.local', 'share', 'Cursor')
      
      let foundSystemPath: string | null = null
      for (const sysPath of systemPaths) {
        if (existsSync(sysPath)) {
          foundSystemPath = sysPath
          break
        }
      }
      
      if (foundSystemPath) {
        sendLog(`[INFO] Found Cursor in system location: ${foundSystemPath}`)
        sendLog(`[INFO] Moving to user location: ${userPath}`)
        
        if (existsSync(userPath)) {
          sendLog(`[WARN] Target location already exists, removing...`)
          await fs.remove(userPath)
        }
        
        await fs.ensureDir(dirname(userPath))
        await fs.move(foundSystemPath, userPath)
        
        sendLog(`[OK] Cursor moved to user location`)
      } else if (existsSync(userPath)) {
        sendLog(`[OK] Cursor is already in user location`)
      } else {
        sendLog(`[INFO] Cursor installation not found in expected locations`)
        return { success: false, logs, error: 'Cursor installation not found' }
      }
      
      sendLog(`[OK] Location fix completed`)
    }
    
    return { success: true, logs }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

ipcMain.handle('docs:open', async () => {
  if (docsWindow) {
    docsWindow.close()
  }

  docsWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    icon: join(__dirname, process.platform === 'win32' ? '../public/icon.ico' : '../public/icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: false
  })

  docsWindow.on('closed', () => {
    docsWindow = null
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    docsWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}docs.html`)
  } else {
    docsWindow.loadFile(join(__dirname, '../dist/docs.html'))
  }
})

// Docs window controls
ipcMain.handle('docs:minimize', () => {
  try {
    if (docsWindow && !docsWindow.isDestroyed()) {
      docsWindow.minimize()
    }
  } catch (err) {
    console.error('Error minimizing docs window:', err)
  }
})

ipcMain.handle('docs:maximize', () => {
  try {
    if (docsWindow && !docsWindow.isDestroyed()) {
      if (docsWindow.isMaximized()) {
        docsWindow.unmaximize()
      } else {
        docsWindow.maximize()
      }
    }
  } catch (err) {
    console.error('Error maximizing docs window:', err)
  }
})

ipcMain.handle('docs:close', () => {
  try {
    if (docsWindow && !docsWindow.isDestroyed()) {
      docsWindow.close()
    }
  } catch (err) {
    console.error('Error closing docs window:', err)
  }
})

// ============================================
// IPC Handlers - Path Utilities
// ============================================

function getUserDocumentsPath(): string {
  if (process.platform === 'win32') {
    return join(process.env.USERPROFILE || homedir(), 'Documents')
  } else if (process.platform === 'darwin') {
    return join(homedir(), 'Documents')
  } else {
    return process.env.XDG_DOCUMENTS_DIR || join(homedir(), 'Documents')
  }
}

function getAccountsFilePath(): string {
  return join(getUserDocumentsPath(), 'CursorFreeVIP', 'accounts.json')
}

function getConfigDir(): string {
  return join(getUserDocumentsPath(), '.cursor-free-vip')
}

function getCursorPaths(): { storagePath: string; sqlitePath: string; cursorPath: string; machineIdPath: string } {
  const platform = process.platform
  
  if (platform === 'win32') {
    const appdata = process.env.APPDATA || ''
    const localappdata = process.env.LOCALAPPDATA || ''
    return {
      storagePath: join(appdata, 'Cursor', 'User', 'globalStorage', 'storage.json'),
      sqlitePath: join(appdata, 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      cursorPath: join(localappdata, 'Programs', 'Cursor', 'resources', 'app'),
      machineIdPath: join(appdata, 'Cursor', 'machineId')
    }
  } else if (platform === 'darwin') {
    const home = process.env.HOME || ''
    return {
      storagePath: join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'storage.json'),
      sqlitePath: join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      cursorPath: '/Applications/Cursor.app/Contents/Resources/app',
      machineIdPath: join(home, 'Library', 'Application Support', 'Cursor', 'machineId')
    }
  } else {
    const home = process.env.HOME || ''
    const configDir = join(home, '.config')
    const cursorDir = existsSync(join(configDir, 'Cursor')) ? 'Cursor' : 'cursor'
    
    return {
      storagePath: join(configDir, cursorDir, 'User', 'globalStorage', 'storage.json'),
      sqlitePath: join(configDir, cursorDir, 'User', 'globalStorage', 'state.vscdb'),
      cursorPath: existsSync('/opt/Cursor/resources/app') ? '/opt/Cursor/resources/app' : '/usr/share/cursor/resources/app',
      machineIdPath: join(configDir, cursorDir, 'machineid')
    }
  }
}

ipcMain.handle('paths:getCursorPaths', () => {
  return getCursorPaths()
})

ipcMain.handle('paths:getConfigDir', () => {
  return getConfigDir()
})

// ============================================
// IPC Handlers - Configuration
// ============================================

ipcMain.handle('config:load', () => {
  const configDir = getConfigDir()
  const configFile = join(configDir, 'config.json')
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  if (existsSync(configFile)) {
    try {
      return JSON.parse(readFileSync(configFile, 'utf-8'))
    } catch {
      return {}
    }
  }
  return {}
})

ipcMain.handle('config:save', (_, config: object) => {
  const configDir = getConfigDir()
  const configFile = join(configDir, 'config.json')
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8')
  return true
})

// Color configuration handlers
ipcMain.handle('colors:load', () => {
  const configDir = getConfigDir()
  const colorsFile = join(configDir, 'colors.json')
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  if (existsSync(colorsFile)) {
    try {
      return JSON.parse(readFileSync(colorsFile, 'utf-8'))
    } catch (e) {
      console.error('Failed to load colors:', e)
      return null
    }
  }
  
  return null
})

ipcMain.handle('colors:save', (_, colors: object) => {
  const configDir = getConfigDir()
  const colorsFile = join(configDir, 'colors.json')
  
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  
  writeFileSync(colorsFile, JSON.stringify(colors, null, 2), 'utf-8')
  return true
})

// ============================================
// SQLite Database Helpers
// ============================================

async function updateSqliteDatabase(dbPath: string, updates: Record<string, string>, sendLog: (msg: string) => void): Promise<boolean> {
  if (!SQL) {
    await initSqlJs()
  }
  
  if (!SQL) {
    sendLog('[WARN] SQLite not available')
    return false
  }
  
  try {
    const buffer = readFileSync(dbPath)
    const db = new SQL.Database(buffer)
    
    for (const [key, value] of Object.entries(updates)) {
      try {
        const updateStmt = db.prepare('UPDATE ItemTable SET value = ? WHERE key = ?')
        updateStmt.run([value, key])
        updateStmt.free()
        
        const changes = db.getRowsModified()
        if (changes === 0) {
          const insertStmt = db.prepare('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)')
          insertStmt.run([key, value])
          insertStmt.free()
        }
        
        sendLog(`  [OK] ${key}: updated`)
      } catch (err: any) {
        sendLog(`  [WARN] ${key}: ${err.message}`)
      }
    }
    
    const data = db.export()
    const outputBuffer = Buffer.from(data)
    writeFileSync(dbPath, outputBuffer)
    
    db.close()
    return true
  } catch (err: any) {
    sendLog(`[WARN] SQLite error: ${err.message}`)
    return false
  }
}

async function readSqliteValue(dbPath: string, key: string): Promise<string | null> {
  if (!SQL) {
    await initSqlJs()
  }
  
  if (!SQL || !existsSync(dbPath)) {
    return null
  }
  
  try {
    const buffer = readFileSync(dbPath)
    const db = new SQL.Database(buffer)
    
    const stmt = db.prepare('SELECT value FROM ItemTable WHERE key = ?')
    stmt.bind([key])
    
    let value: string | null = null
    if (stmt.step()) {
      value = stmt.get()[0] as string
    }
    
    stmt.free()
    db.close()
    return value
  } catch {
    return null
  }
}

// ============================================
// IPC Handlers - Machine ID Reset
// ============================================

function generateNewIds() {
  const devDeviceId = uuidv4()
  const machineId = createHash('sha256').update(randomBytes(32)).digest('hex')
  const macMachineId = createHash('sha512').update(randomBytes(64)).digest('hex')
  const sqmId = `{${uuidv4().toUpperCase()}}`
  
  return {
    'telemetry.devDeviceId': devDeviceId,
    'telemetry.macMachineId': macMachineId,
    'telemetry.machineId': machineId,
    'telemetry.sqmId': sqmId,
    'storage.serviceMachineId': devDeviceId
  }
}

ipcMain.handle('machine:resetIds', async (event) => {
  const paths = getCursorPaths()
  const logs: string[] = []
  
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  try {
    sendLog('[INFO] Starting machine ID reset...')
    
    if (!existsSync(paths.storagePath)) {
      sendLog(`[ERROR] Storage file not found: ${paths.storagePath}`)
      return { success: false, logs, error: 'Storage file not found' }
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${paths.storagePath}.bak.${timestamp}`
    copyFileSync(paths.storagePath, backupPath)
    sendLog(`[INFO] Backup created: ${backupPath}`)
    
    sendLog('[INFO] Reading storage.json...')
    const storageData = JSON.parse(readFileSync(paths.storagePath, 'utf-8'))
    const newIds = generateNewIds()
    
    Object.assign(storageData, newIds)
    
    sendLog('[INFO] Writing new IDs to storage.json...')
    writeFileSync(paths.storagePath, JSON.stringify(storageData, null, 4), 'utf-8')
    
    const machineIdDir = join(paths.machineIdPath, '..')
    if (!existsSync(machineIdDir)) {
      mkdirSync(machineIdDir, { recursive: true })
    }
    writeFileSync(paths.machineIdPath, newIds['telemetry.devDeviceId'], 'utf-8')
    sendLog('[OK] Machine ID file updated')
    
    if (existsSync(paths.sqlitePath)) {
      sendLog('[INFO] Updating SQLite database...')
      
      const sqliteBackupPath = `${paths.sqlitePath}.bak.${timestamp}`
      copyFileSync(paths.sqlitePath, sqliteBackupPath)
      sendLog(`[INFO] SQLite backup created`)
      
      const sqliteUpdates: Record<string, string> = {
        'telemetry.devDeviceId': newIds['telemetry.devDeviceId'],
        'telemetry.macMachineId': newIds['telemetry.macMachineId'],
        'telemetry.machineId': newIds['telemetry.machineId'],
        'telemetry.sqmId': newIds['telemetry.sqmId'],
        'storage.serviceMachineId': newIds['storage.serviceMachineId']
      }
      
      const sqliteSuccess = await updateSqliteDatabase(paths.sqlitePath, sqliteUpdates, sendLog)
      if (sqliteSuccess) {
        sendLog('[OK] SQLite database updated')
      }
    }
    
    if (process.platform === 'win32') {
      sendLog('[INFO] Updating Windows registry...')
      try {
        const newGuid = uuidv4()
        execSync(`reg add "HKLM\\SOFTWARE\\Microsoft\\SQMClient" /v MachineId /t REG_SZ /d "{${newGuid.toUpperCase()}}" /f`, { stdio: 'ignore' })
        sendLog('[OK] Windows registry updated')
      } catch (err) {
        sendLog('[WARN] Could not update registry (may need admin rights)')
      }
    }
    
    sendLog('')
    sendLog('[OK] Machine ID reset completed')
    sendLog('')
    sendLog('New IDs generated:')
    for (const [key, value] of Object.entries(newIds)) {
      sendLog(`  ${key}: ${value}`)
    }
    
    return { success: true, logs, newIds }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

// ============================================
// IPC Handlers - Cursor Process Management
// ============================================

ipcMain.handle('cursor:quit', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Attempting to close Cursor...')
  
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM Cursor.exe /T', { stdio: 'ignore' })
    } else {
      execSync('pkill -f Cursor', { stdio: 'ignore' })
    }
    sendLog('[OK] Cursor processes terminated')
    return { success: true, logs }
  } catch {
    sendLog('[INFO] No Cursor processes found or already closed')
    return { success: true, logs }
  }
})

// ============================================
// IPC Handlers - Auto Update Disable
// ============================================

ipcMain.handle('update:disable', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Disabling Cursor auto-update...')
  
  try {
    let updaterPath: string
    let updateYmlPath: string
    
    if (process.platform === 'win32') {
      updaterPath = join(process.env.LOCALAPPDATA || '', 'cursor-updater')
      updateYmlPath = join(process.env.LOCALAPPDATA || '', 'Programs', 'Cursor', 'resources', 'app-update.yml')
    } else if (process.platform === 'darwin') {
      updaterPath = join(process.env.HOME || '', 'Library', 'Application Support', 'cursor-updater')
      updateYmlPath = '/Applications/Cursor.app/Contents/Resources/app-update.yml'
    } else {
      updaterPath = join(process.env.HOME || '', '.config', 'cursor-updater')
      updateYmlPath = join(process.env.HOME || '', '.config', 'cursor', 'resources', 'app-update.yml')
    }
    
    if (await fs.pathExists(updaterPath)) {
      try {
        sendLog(`[INFO] Removing updater directory: ${updaterPath}`)
        if (process.platform === 'win32') {
          try {
            execSync(`attrib -r "${updaterPath}" /s /d`, { stdio: 'ignore' })
          } catch {
          }
        }
        await fs.remove(updaterPath)
        sendLog(`[OK] Removed updater directory`)
      } catch (err: any) {
        sendLog(`[WARN] Could not remove updater directory: ${err.message}`)
        try {
          if (process.platform === 'win32') {
            execSync(`rmdir /s /q "${updaterPath}"`, { stdio: 'ignore' })
          } else {
            execSync(`rm -rf "${updaterPath}"`, { stdio: 'ignore' })
          }
          sendLog(`[OK] Removed updater directory (alternative method)`)
        } catch (err2: any) {
          sendLog(`[WARN] Alternative removal also failed: ${err2.message}`)
        }
      }
    } else {
      sendLog(`[INFO] Updater directory does not exist: ${updaterPath}`)
    }
    
    if (await fs.pathExists(updateYmlPath)) {
      try {
        sendLog(`[INFO] Modifying update config: ${updateYmlPath}`)
        if (process.platform === 'win32') {
          try {
            execSync(`attrib -r "${updateYmlPath}"`, { stdio: 'ignore' })
          } catch {
          }
        }
        
        await fs.writeFile(updateYmlPath, '# Auto-update disabled\nversion: 0.0.0\n', 'utf-8')
        
        if (process.platform === 'win32') {
          try {
            execSync(`attrib +r "${updateYmlPath}"`, { stdio: 'ignore' })
          } catch {
          }
        } else {
          await fs.chmod(updateYmlPath, 0o444)
        }
        sendLog('[OK] Update config file cleared and locked')
      } catch (err: any) {
        sendLog(`[WARN] Could not modify update config file: ${err.message}`)
      }
    } else {
      sendLog(`[INFO] Update config file does not exist: ${updateYmlPath}`)
    }
    
    try {
      const dir = join(updaterPath, '..')
      sendLog(`[INFO] Creating blocking file in: ${dir}`)
      
      await fs.ensureDir(dir)
      
      await fs.writeFile(updaterPath, '# Auto-update disabled by Cursor Free VIP\n', 'utf-8')
      
      if (process.platform === 'win32') {
        try {
          execSync(`attrib +r "${updaterPath}"`, { stdio: 'ignore' })
        } catch {
        }
      } else {
        await fs.chmod(updaterPath, 0o444)
      }
      sendLog('[OK] Created blocking file')
    } catch (err: any) {
      sendLog(`[WARN] Could not create blocking file: ${err.message}`)
    }
    
    sendLog('[OK] Auto-update disabled successfully')
    return { success: true, logs }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    sendLog(`[ERROR] Stack: ${err.stack}`)
    return { success: false, logs, error: err.message }
  }
})

// ============================================
// IPC Handlers - Token Limit Bypass
// ============================================

ipcMain.handle('token:bypass', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Starting token limit bypass...')
  
  try {
    const paths = getCursorPaths()
    const workbenchPath = join(paths.cursorPath, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    
    if (!existsSync(workbenchPath)) {
      sendLog(`[ERROR] Workbench file not found: ${workbenchPath}`)
      return { success: false, logs, error: 'Workbench file not found' }
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${workbenchPath}.bak.${timestamp}`
    copyFileSync(workbenchPath, backupPath)
    sendLog(`[INFO] Backup created`)
    
    let content = readFileSync(workbenchPath, 'utf-8')
    
    const replacements: [string, string][] = [
      ['<div>Pro Trial', '<div>Pro'],
      ['py-1">Auto-select', 'py-1">Bypass-Version-Pin'],
      ['async getEffectiveTokenLimit(e){const n=e.modelName;if(!n)return 2e5;', 
       'async getEffectiveTokenLimit(e){return 9000000;const n=e.modelName;if(!n)return 9e5;'],
      ['notifications-toasts', 'notifications-toasts hidden']
    ]
    
    let modified = false
    for (const [oldStr, newStr] of replacements) {
      if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr)
        modified = true
      }
    }
    
    if (modified) {
      writeFileSync(workbenchPath, content, 'utf-8')
      sendLog('[OK] Token limit bypass applied')
    } else {
      sendLog('[INFO] No modifications needed or already applied')
    }
    
    return { success: true, logs }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

// ============================================
// IPC Handlers - Account Info
// ============================================

ipcMain.handle('account:getInfo', async () => {
  const paths = getCursorPaths()
  
  try {
    let email: string | null = null
    let token: string | null = null
    let machineId: string | null = null
    let devDeviceId: string | null = null
    
    if (existsSync(paths.storagePath)) {
      const data = JSON.parse(readFileSync(paths.storagePath, 'utf-8'))
      email = data['cursorAuth/cachedEmail'] || null
      token = data['cursorAuth/accessToken'] || null
      machineId = data['telemetry.machineId'] || null
      devDeviceId = data['telemetry.devDeviceId'] || null
    }
    
    if (existsSync(paths.sqlitePath)) {
      if (!email) {
        email = await readSqliteValue(paths.sqlitePath, 'cursorAuth/cachedEmail')
      }
      if (!token) {
        token = await readSqliteValue(paths.sqlitePath, 'cursorAuth/accessToken')
      }
      if (!machineId) {
        machineId = await readSqliteValue(paths.sqlitePath, 'telemetry.machineId')
      }
      if (!devDeviceId) {
        devDeviceId = await readSqliteValue(paths.sqlitePath, 'telemetry.devDeviceId')
      }
    }
    
    return { email, token, machineId, devDeviceId }
  } catch {
    return { email: null, token: null, machineId: null, devDeviceId: null }
  }
})

ipcMain.handle('account:getSubscriptionInfo', async () => {
  const paths = getCursorPaths()
  
  try {
    let token: string | null = null
    
    if (existsSync(paths.storagePath)) {
      const data = JSON.parse(readFileSync(paths.storagePath, 'utf-8'))
      token = data['cursorAuth/accessToken'] || null
    }
    
    if (!token && existsSync(paths.sqlitePath)) {
      token = await readSqliteValue(paths.sqlitePath, 'cursorAuth/accessToken')
    }
    
    if (!token) {
      return { success: false, subscriptionType: null, daysRemaining: null }
    }
    
    const url = 'https://api2.cursor.sh/auth/full_stripe_profile'
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(url, { headers, method: 'GET' })
    
    if (!response.ok) {
      return { success: false, subscriptionType: null, daysRemaining: null }
    }
    
    const subscriptionData = await response.json()
    
    let subscriptionType: string | null = null
    let daysRemaining: number | null = null
    
    if (subscriptionData) {
      if ('membershipType' in subscriptionData) {
        const membershipType = subscriptionData.membershipType || ''
        const subscriptionStatus = subscriptionData.subscriptionStatus || ''
        
        if (subscriptionStatus === 'active') {
          if (membershipType === 'pro') {
            subscriptionType = 'Pro'
          } else if (membershipType === 'free_trial') {
            subscriptionType = 'Free Trial'
          } else if (membershipType === 'pro_trial') {
            subscriptionType = 'Pro Trial'
          } else if (membershipType === 'team') {
            subscriptionType = 'Team'
          } else if (membershipType === 'enterprise') {
            subscriptionType = 'Enterprise'
          } else if (membershipType) {
            subscriptionType = membershipType.charAt(0).toUpperCase() + membershipType.slice(1)
          }
        } else if (subscriptionStatus) {
          subscriptionType = `${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)} (${subscriptionStatus})`
        }
      } else if ('subscription' in subscriptionData) {
        const subscription = subscriptionData.subscription
        const plan = subscription?.plan?.nickname || 'Unknown'
        const status = subscription?.status || 'unknown'
        
        if (status === 'active') {
          if (plan.toLowerCase().includes('pro') && !plan.toLowerCase().includes('trial')) {
            subscriptionType = 'Pro'
          } else if (plan.toLowerCase().includes('pro_trial')) {
            subscriptionType = 'Pro Trial'
          } else if (plan.toLowerCase().includes('free_trial')) {
            subscriptionType = 'Free Trial'
          } else if (plan.toLowerCase().includes('team')) {
            subscriptionType = 'Team'
          } else if (plan.toLowerCase().includes('enterprise')) {
            subscriptionType = 'Enterprise'
          } else {
            subscriptionType = plan
          }
        } else {
          subscriptionType = `${plan} (${status})`
        }
      }
      
      daysRemaining = subscriptionData.daysRemainingOnTrial ?? null
    }
    
    return { success: true, subscriptionType, daysRemaining }
  } catch {
    return { success: false, subscriptionType: null, daysRemaining: null }
  }
})

// ============================================
// IPC Handlers - Multi-Account Manager
// ============================================

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

ipcMain.handle('accounts:getAccounts', async () => {
  try {
    const accountsPath = getAccountsFilePath()
    if (!existsSync(accountsPath)) {
      return { success: true, accounts: [] }
    }
    
    const data = readFileSync(accountsPath, 'utf-8')
    const accounts = JSON.parse(data)
    return { success: true, accounts: Array.isArray(accounts) ? accounts : [] }
  } catch (err: any) {
    return { success: false, error: err.message, accounts: [] }
  }
})

ipcMain.handle('accounts:getAccountsFromFile', async (event, filePath: string) => {
  try {
    if (!existsSync(filePath)) {
      return { success: true, accounts: [] }
    }
    
    const data = readFileSync(filePath, 'utf-8')
    const accounts = JSON.parse(data)
    return { success: true, accounts: Array.isArray(accounts) ? accounts : [] }
  } catch (err: any) {
    return { success: false, error: err.message, accounts: [] }
  }
})

ipcMain.handle('accounts:createAccount', async (event, accountData: { name: string; email: string; accessToken: string; refreshToken?: string }, targetFilePath?: string) => {
  try {
    const accountsPath = targetFilePath || getAccountsFilePath()
    const accountsDir = dirname(accountsPath)
    
    if (!existsSync(accountsDir)) {
      mkdirSync(accountsDir, { recursive: true })
    }
    
    let accounts: Account[] = []
    if (existsSync(accountsPath)) {
      const data = readFileSync(accountsPath, 'utf-8')
      accounts = JSON.parse(data)
      if (!Array.isArray(accounts)) accounts = []
    }
    
    const newIds = generateNewIds()
    
    const newAccount: Account = {
      id: uuidv4(),
      name: accountData.name,
      email: accountData.email,
      accessToken: accountData.accessToken,
      refreshToken: accountData.refreshToken,
      machineId: newIds['telemetry.machineId'],
      devDeviceId: newIds['telemetry.devDeviceId'],
      createdAt: new Date().toISOString()
    }
    
    accounts.push(newAccount)
    
    writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf-8')
    
    return { success: true, account: newAccount }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('accounts:importAccounts', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Import Accounts',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    
    if (result.canceled || !result.filePaths.length) {
      return { success: false, error: 'No file selected' }
    }
    
    const filePath = result.filePaths[0]
    if (!existsSync(filePath)) {
      return { success: false, error: 'File not found' }
    }
    
    const data = readFileSync(filePath, 'utf-8')
    const importedAccounts = JSON.parse(data)
    
    if (!Array.isArray(importedAccounts)) {
      return { success: false, error: 'Invalid JSON format: expected array' }
    }
    
    return { success: true, filePath, accounts: importedAccounts, imported: importedAccounts.length }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('accounts:exportAccounts', async () => {
  try {
    const accountsPath = getAccountsFilePath()
    if (!existsSync(accountsPath)) {
      return { success: false, error: 'No accounts file found' }
    }
    
    const data = readFileSync(accountsPath, 'utf-8')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('accounts:switchAccount', async (event, accountId: string) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  try {
    const accountsPath = getAccountsFilePath()
    if (!existsSync(accountsPath)) {
      return { success: false, logs, error: 'Accounts file not found' }
    }
    
    const data = readFileSync(accountsPath, 'utf-8')
    const accounts: Account[] = JSON.parse(data)
    
    const account = accounts.find(a => a.id === accountId)
    if (!account) {
      return { success: false, logs, error: 'Account not found' }
    }
    
    sendLog(`[INFO] Switching to account: ${account.name}`)
    sendLog('[INFO] Applying account credentials to Cursor...')
    
    const paths = getCursorPaths()
    
    let storageData: Record<string, any> = {}
    if (existsSync(paths.storagePath)) {
      storageData = JSON.parse(readFileSync(paths.storagePath, 'utf-8'))
    }
    
    storageData['cursorAuth/cachedSignUpType'] = 'Auth_0'
    storageData['cursorAuth/cachedEmail'] = account.email
    storageData['cursorAuth/accessToken'] = account.accessToken
    if (account.refreshToken) {
      storageData['cursorAuth/refreshToken'] = account.refreshToken
    }
    if (account.machineId) {
      storageData['telemetry.machineId'] = account.machineId
    }
    if (account.devDeviceId) {
      storageData['telemetry.devDeviceId'] = account.devDeviceId
    }
    
    const storageDir = dirname(paths.storagePath)
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true })
    }
    writeFileSync(paths.storagePath, JSON.stringify(storageData, null, 4), 'utf-8')
    sendLog('[OK] storage.json updated')
    
    if (existsSync(paths.sqlitePath)) {
      sendLog('[INFO] Updating SQLite database...')
      const sqliteUpdates: Record<string, string> = {
        'cursorAuth/cachedSignUpType': 'Auth_0',
        'cursorAuth/cachedEmail': account.email,
        'cursorAuth/accessToken': account.accessToken
      }
      if (account.refreshToken) {
        sqliteUpdates['cursorAuth/refreshToken'] = account.refreshToken
      }
      if (account.machineId) {
        sqliteUpdates['telemetry.machineId'] = account.machineId
      }
      if (account.devDeviceId) {
        sqliteUpdates['telemetry.devDeviceId'] = account.devDeviceId
      }
      
      const success = await updateSqliteDatabase(paths.sqlitePath, sqliteUpdates, sendLog)
      if (success) {
        sendLog('[OK] SQLite database updated')
      }
    }
    
    if (account.machineId && existsSync(paths.machineIdPath)) {
      writeFileSync(paths.machineIdPath, account.machineId, 'utf-8')
      sendLog('[OK] Machine ID file updated')
    }
    
    sendLog('[OK] Account switched successfully')
    sendLog('[INFO] Please restart Cursor for changes to take effect')
    
    return { success: true, logs }
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

ipcMain.handle('accounts:deleteAccount', async (event, accountId: string, targetFilePath?: string) => {
  try {
    const accountsPath = targetFilePath || getAccountsFilePath()
    if (!existsSync(accountsPath)) {
      return { success: false, error: 'Accounts file not found' }
    }
    
    const data = readFileSync(accountsPath, 'utf-8')
    const accounts: Account[] = JSON.parse(data)
    
    const filteredAccounts = accounts.filter(a => a.id !== accountId)
    
    writeFileSync(accountsPath, JSON.stringify(filteredAccounts, null, 2), 'utf-8')
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('accounts:getAccountsFilePath', () => {
  return getAccountsFilePath()
})

ipcMain.handle('account:updateAuth', async (event, { email, accessToken, refreshToken }) => {
  const paths = getCursorPaths()
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  try {
    sendLog('[INFO] Updating authentication...')
    
    let data: Record<string, any> = {}
    if (existsSync(paths.storagePath)) {
      data = JSON.parse(readFileSync(paths.storagePath, 'utf-8'))
    }
    
    data['cursorAuth/cachedSignUpType'] = 'Auth_0'
    if (email) data['cursorAuth/cachedEmail'] = email
    if (accessToken) data['cursorAuth/accessToken'] = accessToken
    if (refreshToken) data['cursorAuth/refreshToken'] = refreshToken
    
    const dir = join(paths.storagePath, '..')
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    
    writeFileSync(paths.storagePath, JSON.stringify(data, null, 4), 'utf-8')
    sendLog('[OK] storage.json updated')
    
    if (existsSync(paths.sqlitePath)) {
      sendLog('[INFO] Updating SQLite database...')
      
      const sqliteUpdates: Record<string, string> = {
        'cursorAuth/cachedSignUpType': 'Auth_0'
      }
      if (email) sqliteUpdates['cursorAuth/cachedEmail'] = email
      if (accessToken) sqliteUpdates['cursorAuth/accessToken'] = accessToken
      if (refreshToken) sqliteUpdates['cursorAuth/refreshToken'] = refreshToken
      
      const success = await updateSqliteDatabase(paths.sqlitePath, sqliteUpdates, sendLog)
      if (success) {
        sendLog('[OK] SQLite database updated')
      }
    }
    
    sendLog('[OK] Authentication updated successfully')
    
    return { success: true, logs }
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})

// ============================================
// IPC Handlers - Totally Reset
// ============================================

ipcMain.handle('cursor:totallyReset', async (event) => {
  const logs: string[] = []
  const sendLog = (message: string) => {
    logs.push(message)
    event.sender.send('log:message', message)
  }
  
  sendLog('[INFO] Starting complete Cursor reset...')
  sendLog('[WARN] This will remove all Cursor settings and data')
  
  try {
    const paths = getCursorPaths()
    
    let cursorDataDirs: string[] = []
    
    if (process.platform === 'win32') {
      const appdata = process.env.APPDATA || ''
      const localappdata = process.env.LOCALAPPDATA || ''
      cursorDataDirs = [
        join(appdata, 'Cursor'),
        join(localappdata, 'cursor-updater')
      ]
    } else if (process.platform === 'darwin') {
      const home = process.env.HOME || ''
      cursorDataDirs = [
        join(home, 'Library', 'Application Support', 'Cursor'),
        join(home, 'Library', 'Application Support', 'cursor-updater'),
        join(home, 'Library', 'Preferences', 'com.cursor.Cursor.plist'),
        join(home, 'Library', 'Caches', 'com.cursor.Cursor')
      ]
    } else {
      const home = process.env.HOME || ''
      cursorDataDirs = [
        join(home, '.config', 'Cursor'),
        join(home, '.config', 'cursor'),
        join(home, '.config', 'cursor-updater')
      ]
    }
    
    for (const dir of cursorDataDirs) {
      if (existsSync(dir)) {
        try {
          const stats = statSync(dir)
          if (stats.isDirectory()) {
            execSync(process.platform === 'win32' ? `rmdir /s /q "${dir}"` : `rm -rf "${dir}"`)
          } else {
            unlinkSync(dir)
          }
          sendLog(`[OK] Removed: ${dir}`)
        } catch (err: any) {
          sendLog(`[WARN] Could not remove: ${dir} - ${err.message}`)
        }
      }
    }
    
    sendLog('')
    sendLog('[INFO] Resetting machine identifiers...')
    
    const newIds = generateNewIds()
    
    const storageDir = join(paths.storagePath, '..')
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true })
    }
    
    writeFileSync(paths.storagePath, JSON.stringify(newIds, null, 4), 'utf-8')
    sendLog('[OK] Created fresh storage.json with new IDs')
    
    const machineIdDir = join(paths.machineIdPath, '..')
    if (!existsSync(machineIdDir)) {
      mkdirSync(machineIdDir, { recursive: true })
    }
    writeFileSync(paths.machineIdPath, newIds['telemetry.devDeviceId'], 'utf-8')
    sendLog('[OK] Created fresh machineId file')
    
    sendLog('')
    sendLog('[OK] Complete reset finished')
    sendLog('[INFO] Please restart your system for full effect')
    
    return { success: true, logs }
    
  } catch (err: any) {
    sendLog(`[ERROR] ${err.message}`)
    return { success: false, logs, error: err.message }
  }
})
