/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Black to White
        black: 'rgb(var(--color-black) / <alpha-value>)',
        white: 'rgb(var(--color-white) / <alpha-value>)',
        
        // Onyx scale (dark grays) - All controlled via CSS variables
        onyx: {
          950: 'rgb(var(--color-onyx-950) / <alpha-value>)',
          900: 'rgb(var(--color-onyx-900) / <alpha-value>)',
          800: 'rgb(var(--color-onyx-800) / <alpha-value>)',
          700: 'rgb(var(--color-onyx-700) / <alpha-value>)',
          600: 'rgb(var(--color-onyx-600) / <alpha-value>)',
          500: 'rgb(var(--color-onyx-500) / <alpha-value>)',
          400: 'rgb(var(--color-onyx-400) / <alpha-value>)',
          300: 'rgb(var(--color-onyx-300) / <alpha-value>)',
          200: 'rgb(var(--color-onyx-200) / <alpha-value>)',
          100: 'rgb(var(--color-onyx-100) / <alpha-value>)',
          50: 'rgb(var(--color-onyx-50) / <alpha-value>)',
        },
        
        // Gold accent (subtle) - All controlled via CSS variables
        gold: {
          600: 'rgb(var(--color-gold-600) / <alpha-value>)',
          500: 'rgb(var(--color-gold-500) / <alpha-value>)',
          400: 'rgb(var(--color-gold-400) / <alpha-value>)',
          300: 'rgb(var(--color-gold-300) / <alpha-value>)',
          200: 'rgb(var(--color-gold-200) / <alpha-value>)',
          100: 'rgb(var(--color-gold-100) / <alpha-value>)',
        },
        
        // Semantic colors - All controlled via CSS variables
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
