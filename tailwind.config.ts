import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blush: '#FEF0EC',
        accent: '#8B4A3A',
        mauve: '#C49A8A',
      },
      fontFamily: {
        script: ['var(--font-pinyon-script)', 'cursive'],
        body: ['var(--font-cormorant-garamond)', 'serif'],
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' },
        },
        'tick': {
          '0%': { opacity: '0.35', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Game.tsx: hearts fall the full arena height; duration is set inline
        // per heart (faster = harder). Starts above and ends below the
        // viewport so spawn/despawn never pop on screen.
        'fall': {
          '0%': { transform: 'translateY(-10vh)' },
          '100%': { transform: 'translateY(110vh)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 1.4s ease-out both',
        'ken-burns': 'ken-burns 22s ease-out forwards',
        'tick': 'tick 0.4s ease-out',
        'fall': 'fall 3s linear forwards',
      },
    },
  },
  plugins: [],
}

export default config
