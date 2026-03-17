/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        slate: {
          950: '#0a0f1a',
          925: '#0d1424',
          900: '#111827',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      }
    }
  },
  plugins: []
}