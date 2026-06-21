/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAECE7',
          100: '#F5C4B3',
          200: '#F0997B',
          400: '#D85A30',
          600: '#993C1D',
          800: '#712B13',
          900: '#4A1B0C'
        },
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)'
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)'
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)'
        },
        info: {
          bg: 'var(--info-bg)',
          text: 'var(--info-text)'
        },
        success: {
          bg: 'var(--success-bg)',
          text: 'var(--success-text)'
        },
        warning: {
          bg: 'var(--warning-bg)',
          text: 'var(--warning-text)'
        },
        danger: {
          bg: 'var(--danger-bg)',
          text: 'var(--danger-text)'
        },
        guided: {
          bg: 'var(--guided-bg)',
          text: 'var(--guided-text)',
          accent: 'var(--guided-accent)'
        }
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)']
      }
    }
  },
  plugins: []
}
