/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f4f1',
        paperAlt: '#ebebe7',
        ink: '#0b0b0d',
        /* Darkened from #6b6b73. The old value measured 4.42:1 against
         * paperAlt (the Services/Tech hover background), which fails WCAG AA
         * for body text. This is 6.01:1 on paper and 5.54:1 on paperAlt. */
        muted: '#5c5c64',
        line: '#e2e2dd',
        accent: '#3d2ef5',
        accent2: '#00d4a0',
        /* accent2 is 1.74:1 on paper — fine for a dot, unreadable as text.
         * Anything that spells words uses this instead: 4.84:1. */
        accent2Text: '#007a5c',
        /* Mockup browser chrome. The old #9a9aa2 was 2.45:1 on #f0f0ed. */
        chrome: '#6e6e77',
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
        popIn: 'popIn .5s cubic-bezier(.16,1,.3,1) both',
        checkDraw: 'checkDraw .6s cubic-bezier(.16,1,.3,1) .15s both',
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
        popIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        checkDraw: {
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
