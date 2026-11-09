/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // paleta escura herdada do ensino-particular / portfólio do João Pedro
        base: {
          950: '#060910', // fundo principal
          900: '#0a0e1a', // deep-charcoal
          800: '#0f172a', // slate-blue (cards)
          700: '#1e293b',
          600: '#334155',
        },
        accent: {
          DEFAULT: '#06b6d4', // electric-cyan
          soft: '#67e8f9',
          glow: '#7dd3fc',
        },
        // estados dos números da rifa
        livre: '#1e293b',
        reservado: '#f59e0b', // amber
        pago: '#10b981', // emerald
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        'glow-cyan': '0 0 28px rgba(6, 182, 212, 0.35)',
        card: '0 16px 48px rgba(0,0,0,0.5), 0 0 20px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
