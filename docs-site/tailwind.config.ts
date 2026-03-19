import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        dark: {
          50: "#e8e8ef",
          100: "#d1d1df",
          200: "#a3a3bf",
          300: "#75759f",
          400: "#47477f",
          500: "#1a1a3f",
          600: "#15152f",
          700: "#101025",
          800: "#0d0d1a",
          900: "#0a0a0f",
          950: "#050508",
        },
        accent: {
          DEFAULT: "#6366f1",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#d1d1df",
            a: {
              color: "#818cf8",
              "&:hover": {
                color: "#a5b4fc",
              },
            },
            h1: { color: "#e8e8ef" },
            h2: { color: "#e8e8ef" },
            h3: { color: "#e8e8ef" },
            h4: { color: "#e8e8ef" },
            strong: { color: "#e8e8ef" },
            code: { color: "#a5b4fc" },
            "code::before": { content: "" },
            "code::after": { content: "" },
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
