import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#111B2E",
        surface: {
          DEFAULT: "#16223A",
          muted: "#1F2D48",
          subtle: "rgba(22, 34, 58, 0.72)",
          glass: "rgba(17, 25, 40, 0.48)"
        },
        primary: "#7CA5FF",
        accent: "#3FE0F5",
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
        text: {
          DEFAULT: "#F1F5FF",
          muted: "#B9C7DC",
          disabled: "#8093AD"
        },
        border: "#253455",
        midnight: {
          DEFAULT: "#111B2E",
          900: "#0C1524",
          800: "#17233A",
          700: "#22314F",
          600: "#2C4065"
        },
        plasma: {
          DEFAULT: "#3FE0F5",
          600: "#4C6CFF",
          500: "#5B8CFF",
          400: "#63DAFF",
          300: "#6FFFE0"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        card: "0px 20px 45px rgba(8, 15, 28, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
