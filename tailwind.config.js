/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vit: {
          50: '#f0f4fd',
          100: '#e1e9fa',
          200: '#c8d7f7',
          300: '#a1bef1',
          400: '#729ce9',
          500: '#4f7adb',
          600: '#3b5fc3',
          700: '#304ba5',
          800: '#2b3f86',
          900: '#1b2554',
          950: '#0d1330',
        },
        editorial: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'widest-editorial': '0.2em',
      }
    },
  },
  plugins: [],
}
