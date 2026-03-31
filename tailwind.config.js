/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dd: {
          bg:           '#0A0812',
          surface:      '#110F1C',
          card:         '#18162A',
          cardHover:    '#1F1C33',
          border:       'rgba(255,255,255,0.07)',
          purple:       '#774AA4',
          purpleVivid:  '#8B00FF',
          purpleLight:  '#9B6DC5',
          textPrimary:  '#FFFFFF',
          textSecondary:'#A0A0B8',
          textMuted:    '#65637A',
          green:        '#00C389',
          amber:        '#F59E0B',
          blue:         '#60A5FA',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          '"Cascadia Code"',
          'Consolas',
          'monospace',
        ],
      },
      backgroundImage: {
        'hero-gradient': [
          'radial-gradient(ellipse 75% 80% at 50% -10%, rgba(139,0,255,0.55) 0%, rgba(119,74,164,0.4) 20%, rgba(99,44,166,0.2) 45%, transparent 68%)',
          'radial-gradient(ellipse 40% 45% at 50% -8%, rgba(192,36,182,0.22) 0%, transparent 55%)',
        ].join(', '),
        'card-gradient': 'linear-gradient(135deg, rgba(119,74,164,0.08) 0%, transparent 60%)',
        'cta-gradient': 'linear-gradient(135deg, #774AA4 0%, #8B00FF 100%)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.5), 0 1px 20px rgba(0,0,0,0.4)',
        cardHover: '0 8px 32px rgba(10,8,18,0.8), 0 2px 8px rgba(119,74,164,0.25)',
        glow: '0 0 24px rgba(139,0,255,0.45)',
        navGlow: '0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
