import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: '#EF9F27',
          50: '#FAEEDA',
          800: '#633806',
        },
        teal: {
          DEFAULT: '#1D9E75',
          50: '#E1F5EE',
          800: '#085041',
        },
        coral: {
          DEFAULT: '#D85A30',
          50: '#FAECE7',
          800: '#4A1B0C',
        },
        purple: {
          DEFAULT: '#7F77DD',
          50: '#EEEDFE',
          800: '#26215C',
        },
        pink: {
          DEFAULT: '#D4537E',
          50: '#FBEAF0',
          800: '#4B1528',
        },
        ink: {
          DEFAULT: '#1C1917',
          2: '#44403C',
          3: '#78716C',
          4: '#A8A29E',
        },
        surface: '#FAFAF9',
        sidebar: '#18181B',
        border: '#E7E5E4',
        border2: '#D6D3D1',
      },
      fontFamily: {
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
      },
    },
  },
  plugins: [],
}

export default config
