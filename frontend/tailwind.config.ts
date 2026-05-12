import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#103253",
          600: "#0b2742",
          700: "#071d32"
        },
        accent: {
          bronze: "#B87333"
        },
        surface: {
          950: "#000000",
          900: "#0B0B0B",
          800: "#141414",
          700: "#1A1A1A",
          600: "#2A2A2A"
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#A8A8A8",
          muted: "#6F6F6F"
        },
        status: {
          success: "#3BA66B",
          warning: "#D6A84F",
          danger: "#D95C5C"
        }
      },
      borderRadius: {
        ui: "8px"
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.35)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
} satisfies Config;
