/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noc: {
          bg:      '#07091a',
          surface: '#0c1024',
          card:    '#111830',
          border:  '#1e3460',
          hover:   '#182548',
          muted:   '#2a3f6e',
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
