import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0A0A0A",
        gold: {
          light: "#FFE970",
          DEFAULT: "#FFD700",
          dark: "#B8860B",
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        cinematic: ['var(--font-cinzel)', 'serif'],
      }
    },
  },
  plugins: [],
};
export default config;
