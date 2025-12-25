export const colors = {
  black: '#000000',
  onyx: {
    950: '#09090b',
    900: '#0f0f12',
    800: '#18181b',
    700: '#27272a',
    600: '#3f3f46',
    500: '#52525b',
    400: '#71717a',
    300: '#a1a1aa',
    200: '#d4d4d8',
    100: '#e4e4e7',
    50: '#fafafa',
  },
  white: '#ffffff',

  gold: {
    600: '#b8860b',
    500: '#d4a520',
    400: '#e6b82a',
    300: '#f0c850',
    200: '#f5d880',
    100: '#faeab0',
  },

  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
} as const

export const typography = {
  fontFamily: {
    display: '"Tiempos Headline", "Georgia", serif',
    body: '"Styrene A", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"Berkeley Mono", "JetBrains Mono", "Fira Code", monospace',
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const

export const appMeta = {
  name: 'Onyx Pass',
  version: '1.0',
  author: 'ChloeVPin',
  company: 'CCC Suite',
  github: 'https://github.com/ChloeVPin/cursor-free-vip',
  description: 'Free Trial Helper',
  inspiredBy: 'cursor-free-vip',
} as const

