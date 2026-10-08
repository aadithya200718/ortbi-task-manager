import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        canvas: '#0A0A0B',
        surface: {
          DEFAULT: '#111113',
          raised: '#171719',
          elevated: '#1A1A1C',
          subtle: '#0E0E10',
          hover: '#1A1A1C',
          1: '#111113',
          2: '#171719',
          3: '#1E1E22',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.075)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.12)',
          active: 'rgba(255, 255, 255, 0.18)',
        },
        text: {
          primary: '#F5F5F4',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        accent: {
          DEFAULT: '#5B6CFF',
          hover: '#4E5EEB',
          subtle: 'rgba(91, 108, 255, 0.10)',
          border: 'rgba(91, 108, 255, 0.25)',
          dim: '#8B98FF',
        },
        semantic: {
          success: '#10B981',
          'success-dim': '#6ee7b7',
          warning: '#F59E0B',
          'warning-dim': '#fcd34d',
          danger: '#EF4444',
          'danger-dim': '#fca5a5',
          info: '#3B82F6',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '14px',
        '3xl': '16px',
        full: '9999px',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out-custom': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ease-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        ui: '180ms',
        medium: '240ms',
        panel: '320ms',
      },
      boxShadow: {
        panel: '0 12px 32px -8px rgba(0, 0, 0, 0.65)',
        sheet: '-6px 0 24px 0 rgba(0, 0, 0, 0.7)',
        subtle: '0 2px 8px -2px rgba(0, 0, 0, 0.4)',
        dropdown: '0 8px 24px -4px rgba(0, 0, 0, 0.6)',
        // Refined, non-glow shadows tinted to surface
        'surface-sm': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'surface-md': '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.25)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
      },
      // Responsive breakpoints used consistently across the app
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

export default config;
