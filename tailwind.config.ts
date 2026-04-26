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
    },
  },
  plugins: [],
}

export default config
