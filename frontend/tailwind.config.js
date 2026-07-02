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
          DEFAULT: '#0F172A',
          card: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.12)',
        },
        calm: { DEFAULT: '#2DD4BF', glow: 'rgba(45,212,191,0.3)' },
        stress: { DEFAULT: '#F97316', glow: 'rgba(249,115,22,0.3)' },
        fatigue: { DEFAULT: '#818CF8', glow: 'rgba(129,140,248,0.3)' },
        highrisk: '#EF4444',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0,0,0,0.37)',
        glow: '0 0 20px rgba(45,212,191,0.15)',
      },
    },
  },
  plugins: [],
}
