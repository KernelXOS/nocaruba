/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        noc: {
          bg:      '#f0f2f5',
          surface: '#ffffff',
          card:    '#ffffff',
          border:  '#e2e8f0',
          hover:   '#f8fafc',
          muted:   '#64748b',
          primary: '#1e3a5f',
          accent:  '#f59e0b'
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
