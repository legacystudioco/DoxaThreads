

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#000000",
          secondary: "#FFFFFF",
          accent: "#CFCFCF"
        }
      }
    }
  },
  plugins: []
};

export default config;
