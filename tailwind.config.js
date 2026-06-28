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
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          400: '#818CF8',
          600: '#6366F1',
          800: '#4338CA',
          900: '#3730A3'
        },
        violet: {
          400: '#A78BFA',
          600: '#7C3AED',
          800: '#5B21B6'
        },
        coral: {
          400: '#FB923C',
          600: '#F97316'
        },
        rose: {
          400: '#FB7185',
          600: '#F43F5E'
        },
        sunshine: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          600: '#D97706',
          800: '#92400E'
        },
        flag: {
          green: '#0B7C3F',
          white: '#F7F5F3',
          red:   '#CE2B37'
        },
        surface: {
          DEFAULT:   'var(--surface)',
          secondary: 'var(--surface-secondary)',
          tertiary:  'var(--surface-tertiary)'
        },
        ink: {
          primary:   'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary:  'var(--ink-tertiary)'
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong:  'var(--border-strong)'
        },
        info: {
          bg:   'var(--info-bg)',
          text: 'var(--info-text)'
        },
        success: {
          bg:   'var(--success-bg)',
          text: 'var(--success-text)'
        },
        warning: {
          bg:   'var(--warning-bg)',
          text: 'var(--warning-text)'
        },
        danger: {
          bg:   'var(--danger-bg)',
          text: 'var(--danger-text)'
        },
        guided: {
          bg:     'var(--guided-bg)',
          text:   'var(--guided-text)',
          accent: 'var(--guided-accent)'
        }
      },
      borderRadius: {
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '22px'
      },
      fontFamily: {
        sans:    ['var(--font-sans)'],
        display: ['var(--font-display)']
      },
      backgroundSize: {
        '200%': '200% 200%'
      },
      boxShadow: {
        'glow-brand':  '0 0 24px rgba(129,140,248,0.40), 0 0 8px rgba(99,102,241,0.20)',
        'glow-violet': '0 0 24px rgba(167,139,250,0.40)',
        'glow-coral':  '0 0 24px rgba(251,146,60,0.40)',
        'card':        '0 1px 3px rgba(99,102,241,0.07), 0 4px 20px rgba(99,102,241,0.09)',
        'card-hover':  '0 4px 10px rgba(99,102,241,0.12), 0 16px 40px rgba(99,102,241,0.16)'
      }
    }
  },
  plugins: []
}
