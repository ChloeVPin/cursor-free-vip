import { ref, computed, watch } from 'vue'

const privacyEnabled = ref<boolean>(true)

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('privacyEnabled')
  if (saved !== null) {
    privacyEnabled.value = saved === 'true'
  }
}

watch(privacyEnabled, (value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('privacyEnabled', String(value))
  }
})

function getUsername(): string {
  if (typeof window === 'undefined') return ''
  
  const path = window.location?.pathname || ''
  
  const winPattern = /[Cc]:\\[Uu]sers\\([^\\/]+)/
  const unixPattern = /\/(?:Users|home)\/([^\\/]+)/
  
  const winMatch = path.match(winPattern)
  const unixMatch = path.match(unixPattern)
  
  if (winMatch) return winMatch[1]
  if (unixMatch) return unixMatch[1]
  
  return ''
}

function maskSensitiveInfo(text: string, username?: string): string {
  if (!privacyEnabled.value || !text) return text
  
  let masked = text
  
  if (!username) {
    const winUserMatch = text.match(/[Cc]:[\\/][Uu]sers[\\/]([^\\/<>:"|?*\r\n]+)/)
    if (winUserMatch) {
      username = winUserMatch[1]
    } else {
      const macUserMatch = text.match(/\/(?:Users)\/([^\\/<>:"|?*\r\n]+)/)
      if (macUserMatch) {
        username = macUserMatch[1]
      } else {
        const linuxUserMatch = text.match(/\/(?:home)\/([^\\/<>:"|?*\r\n]+)/)
        if (linuxUserMatch) {
          username = linuxUserMatch[1]
        } else {
          const tildeMatch = text.match(/~([^\\/<>:"|?*\r\n]*)/)
          if (tildeMatch && tildeMatch[1]) {
            username = tildeMatch[1].substring(1)
          }
        }
      }
    }
  }
  
  if (username) {
    const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`([Cc]:[\\\\/][Uu]sers[\\\\/])${escapedUsername}(?=[\\\\/])`, 'gi'),
      new RegExp(`(/(?:Users)/)${escapedUsername}(?=[/])`, 'gi'),
      new RegExp(`(/(?:home)/)${escapedUsername}(?=[/])`, 'gi'),
      new RegExp(`(~/?)${escapedUsername}(?=[/])`, 'gi'),
    ]
    
    patterns.forEach(pattern => {
      masked = masked.replace(pattern, (match, prefix) => {
        return prefix + '•••••'
      })
    })
  }
  
  masked = masked.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, (email) => {
    const [local, domain] = email.split('@')
    if (local.length <= 2) return '•••@' + domain
    return local.substring(0, 2) + '•••@' + domain
  })
  
  masked = masked.replace(/\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\b/gi, (match) => {
    return match.substring(0, 4) + '••••-••••-••••-••••-' + match.substring(match.length - 4)
  })
  
  masked = masked.replace(/\b([a-f0-9]{32,})\b/gi, (match) => {
    if (match.length > 20) {
      return match.substring(0, 4) + '••••••••••••••••••••' + match.substring(match.length - 4)
    }
    return '••••••••••••••••'
  })
  
  return masked
}

function getOriginalText(maskedText: string, originalText: string): string {
  return originalText
}

export function usePrivacy() {
  return {
    privacyEnabled: computed({
      get: () => privacyEnabled.value,
      set: (value: boolean) => {
        privacyEnabled.value = value
      }
    }),
    maskSensitiveInfo,
    getOriginalText
  }
}

