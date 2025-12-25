import { colors } from './theme'

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0 0'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

export const generateColorVariables = (customColors?: typeof colors) => {
  if (typeof document === 'undefined') return
  
  const themeColors = customColors || colors
  const root = document.documentElement
  
  root.style.setProperty('--color-black', hexToRgb(themeColors.black))
  root.style.setProperty('--color-white', hexToRgb(themeColors.white))
  
  Object.entries(themeColors.onyx).forEach(([shade, color]) => {
    root.style.setProperty(`--color-onyx-${shade}`, hexToRgb(color))
  })
  
  Object.entries(themeColors.gold).forEach(([shade, color]) => {
    root.style.setProperty(`--color-gold-${shade}`, hexToRgb(color))
  })
  
  root.style.setProperty('--color-success', hexToRgb(themeColors.success))
  root.style.setProperty('--color-warning', hexToRgb(themeColors.warning))
  root.style.setProperty('--color-error', hexToRgb(themeColors.error))
  root.style.setProperty('--color-info', hexToRgb(themeColors.info))
}

if (typeof document !== 'undefined') {
  generateColorVariables()
}

