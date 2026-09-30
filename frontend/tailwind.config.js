/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'rgb(var(--bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
          'surface-2': 'rgb(var(--surface-2-rgb) / <alpha-value>)',
          'surface-3': 'rgb(var(--surface-3-rgb) / <alpha-value>)',
        },
        border: 'var(--border)',
        fg: {
          DEFAULT: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        },
        brand: {
          violet: '#7C6CFF',
          amber: '#FFB454',
          mint: '#3DDC97',
          coral: '#FF6B6B',
          sky: '#5CC8FF',
          rose: '#FF6584',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        'serif-heading': ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        'mono-code': ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'glow-violet': '0 0 25px -5px rgba(124, 108, 255, 0.35)',
        'glow-amber': '0 0 25px -5px rgba(255, 180, 84, 0.35)',
        'glow-mint': '0 0 25px -5px rgba(61, 220, 151, 0.35)',
        'paper-sm': '0 2px 8px rgba(20, 20, 40, 0.06)',
        'paper-md': '0 8px 24px rgba(20, 20, 40, 0.08)',
        'dark-card': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'aurora': 'aurora 18s ease infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.04)' },
        }
      }
    },
  },
  plugins: [],
}
