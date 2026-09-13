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
        background: "var(--background)",
        foreground: "var(--foreground)",
        dm: {
          blue: "#4F46E5",
          "blue-dark": "#4338CA",
          "blue-light": "#EEF2FF",
          navy: "#1E1B4B",
          "navy-light": "#2D2A6E",
          "navy-hover": "#3730A3",
          bg: "#F5F7FF",
          green: "#10B981",
          "green-dark": "#059669",
          "green-light": "#D1FAE5",
          red: "#EF4444",
          "red-light": "#FEE2E2",
          yellow: "#F59E0B",
          "yellow-light": "#FEF3C7",
          border: "#E0E7FF",
          purple: "#7C3AED",
          "purple-light": "#EDE9FE",
          orange: "#F97316",
          "orange-light": "#FFF7ED",
          teal: "#0D9488",
          "teal-light": "#CCFBF1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(79,70,229,0.08), 0 1px 2px -1px rgba(79,70,229,0.04)",
        "card-hover": "0 4px 12px 0 rgba(79,70,229,0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
