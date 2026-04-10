import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          bg: "#EFF6FF",
          card: "#DBEAFE",
          bar: "#3B82F6",
          text: "#1E40AF",
          border: "#93C5FD",
        },
        moderate: {
          bg: "#F0FDF4",
          card: "#DCFCE7",
          bar: "#22C55E",
          text: "#166534",
          border: "#86EFAC",
        },
        warning: {
          bg: "#FFFBEB",
          card: "#FEF3C7",
          bar: "#F59E0B",
          text: "#92400E",
          border: "#FCD34D",
        },
        critical: {
          bg: "#FFF1F2",
          card: "#FFE4E6",
          bar: "#EF4444",
          text: "#7F1D1D",
          border: "#FCA5A5",
        },
        overdue: {
          bg: "#F5F3FF",
          card: "#EDE9FE",
          bar: "#8B5CF6",
          text: "#4C1D95",
          border: "#C4B5FD",
        },
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px 1px #FCA5A5" },
          "50%": { boxShadow: "0 0 14px 5px #EF4444" },
        },
      },
      animation: {
        glow: "glow-pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
