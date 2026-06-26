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
          50: '#E9F2FB',
          100: '#BFDCF5',
          200: '#8AC0ED',
          400: '#2F8FE0',
          600: '#1E6FB8',
          800: '#16548A',
          900: '#0F3A60'
        },
        sunshine: {
          50: '#FFF8E1',
          100: '#FFEDB0',
          200: '#FFE07D',
          400: '#FFC93C',
          600: '#E0A900',
          800: '#A87800'
        },
        flag: {
          green: '#0B7C3F',
          white: '#F7F5F3',
          red: '#CE2B37'
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
