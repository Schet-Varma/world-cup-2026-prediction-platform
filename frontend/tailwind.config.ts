import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        pitch: "#0f5f4a",
        mint: "#d9f99d",
        coral: "#ff6b5f",
        steel: "#d8e1e8"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(16, 24, 40, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
