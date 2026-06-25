/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#f0f4f8',
          surface: '#ffffff',
          elevated: '#e8eef4',
          overlay: '#dde6ef',
        },
        border: {
          DEFAULT: '#c2d4e4',
          bright: '#93b4cc',
        },
        accent: {
          cyan: '#0086a8',
          'cyan-dim': '#005f7a',
          teal: '#00916b',
          'teal-dim': '#006b4f',
        },
        status: {
          critical: '#d9293d',
          warning: '#b87800',
          stable: '#007a55',
          inactive: '#7a9cb0',
        },
        text: {
          primary: '#0d1f2d',
          secondary: '#2d5470',
          muted: '#6a8fa8',
          inverse: '#ffffff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 134, 168, 0.15)',
        'glow-teal': '0 0 20px rgba(0, 145, 107, 0.15)',
        'glow-red': '0 0 20px rgba(217, 41, 61, 0.15)',
        'inner-glow': 'inset 0 1px 0 rgba(0, 134, 168, 0.1)',
      },
    },
  },
  plugins: [],
  safelist: [
    'grid-cols-[1fr_1fr_120px_100px_80px_auto]',
  ],
};
