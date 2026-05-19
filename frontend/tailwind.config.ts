import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#1F1F1F",
          600: "#2A2A2A",
          700: "#0F0F0F"
        },
        accent: {
          bronze: "#B67E5D",
          dark: "#7A4E38"
        },
        surface: {
          950: "#090B0D",
          900: "#15181C",
          elevated: "#171A1E",
          800: "#15181C",
          700: "#1D2025",
          600: "#4A4340",
          500: "#2D2B2B"
        },
        text: {
          primary: "#F3F3F3",
          secondary: "#B1B2B3",
          muted: "#8A8B8D"
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
        subtle: "0 1px 2px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(182, 126, 93, 0.04)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(182, 126, 93, 0.06)"
      }
    }
  },
  plugins: []
} satisfies Config;
