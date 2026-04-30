/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: '#f0f9f4',
          100: '#dbf0e2',
          500: '#3fa566',
          700: '#2d7a4a',
          900: '#1a4a2c',
        },
        midnight: {
          50: '#f1f3fb',
          100: '#dde2f2',
          500: '#3a4a8c',
          700: '#1f2a5c',
          800: '#141c40',
          900: '#0a0e27',
          950: '#050816',
        },
        gold: {
          400: '#f5c542',
          500: '#e0a82e',
          600: '#b58420',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'goal-flash': 'goalFlash 600ms ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        goalFlash: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)', filter: 'brightness(1.4)' },
        },
      },
    },
  },
  plugins: [],
};
