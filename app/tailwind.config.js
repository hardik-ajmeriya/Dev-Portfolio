/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f4f1',
        paperAlt: '#ebebe7',
        ink: '#0b0b0d',
        muted: '#6b6b73',
        line: '#e2e2dd',
        accent: '#3d2ef5',
        accent2: '#00d4a0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        shell: '1500px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.16,1,.3,1)',
      },
      animation: {
        spin: 'spin 1s linear infinite',
        tick: 'tick 34s linear infinite',
        pulseDot: 'pulseDot 2.2s infinite',
        cellIn: 'cellIn .5s cubic-bezier(.16,1,.3,1) both',
      },
      keyframes: {
        tick: {
          to: { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '70%': { boxShadow: '0 0 0 12px rgba(0,212,160,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(0,212,160,0)' },
        },
        cellIn: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
};
