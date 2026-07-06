/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0B1121',
          card: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.06)',
        },
        calm: { DEFAULT: '#2DD4BF', glow: 'rgba(45,212,191,0.25)' },
        stress: { DEFAULT: '#F97316', glow: 'rgba(249,115,22,0.25)' },
        fatigue: { DEFAULT: '#818CF8', glow: 'rgba(129,140,248,0.25)' },
        highrisk: '#EF4444',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.45)',
        glow: '0 0 24px rgba(45,212,191,0.12)',
        'glow-lg': '0 0 48px rgba(45,212,191,0.08)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
