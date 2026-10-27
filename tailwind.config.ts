import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
      colors: {
        primary: { 100: "#f3f3f3", 600: "#666666" },
      },
      boxShadow: {
        subtle: "0 2px 4px #00000014",
        soft: "0 4px 12px #0000001a",
      },
    },
  },
  plugins: [],
};

export default config;
