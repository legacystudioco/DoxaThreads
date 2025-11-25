import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#111111",
          paper: "#F3E8D8",
          blood: "#9E1B24",
          storm: "#1E2A44",
          gold: "#D4A017",
          forest: "#1F5F43",
          accent: "#CBB89B"
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '-0.01em',
        wide: '0.1em',
        wider: '0.15em',
        widest: '0.2em'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem'
      }
    }
  },
  plugins: []
};

export default config;
