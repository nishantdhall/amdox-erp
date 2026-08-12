import type { Config } from 'tailwindcss'

// Brand palette lifted from the AMDOX wireframe spec (AmdoxERP_Wireframe).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e8edff',
          200: '#d4dcff',
          300: '#b3c1ff',
          400: '#879fff',
          500: '#4f6ef7',
          600: '#3d55d9',
          700: '#3143ad',
          800: '#293a8a',
          900: '#25336e',
        },
        ink: {
          DEFAULT: '#1a1d2e',
          soft: '#2a2f45',
          muted: '#8898aa',
          line: '#e0e5ef',
        },
        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f4f6fb',
          raised: '#f7f8fb',
        },
        ok: { DEFAULT: '#22a06b', soft: '#eafbf3' },
        warn: { DEFAULT: '#e6820a', soft: '#fff8e8' },
        danger: { DEFAULT: '#e5484d', soft: '#ffefef' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,29,46,.04), 0 4px 16px rgba(26,29,46,.06)',
        pop: '0 8px 32px rgba(26,29,46,.14)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .3s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
