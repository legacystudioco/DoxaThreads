import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core brand colors - black, white, subtle grays only
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          bone: "#FAFAF8",
          accent: "#E5E5E5",
          secondary: "#FFFFFF"
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '-0.011em',
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
