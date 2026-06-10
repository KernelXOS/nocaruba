/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        noc: {
          bg:      'var(--bg)',
          surface: 'var(--panel)',
          card:    'var(--panel)',
          border:  'var(--border)',
          hover:   'var(--hover)',
          muted:   'var(--muted)',
          primary: '#1e3a5f',
          accent:  'var(--accent)'
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
