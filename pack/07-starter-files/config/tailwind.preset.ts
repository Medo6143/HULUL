import type { Config } from "tailwindcss";

// Tokens come from 04-design/01-design-system.md. Use logical utilities (ms-, me-, ps-, pe-, start, end).
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ink: { 950: "#050B14", 900: "#0A1628", 800: "#0F2038", 700: "#1B2F4D" },
        brand: { DEFAULT: "#00D2FF", strong: "#00A9D1", soft: "#E0F8FF" },
        whatsapp: "#25D366",
        surface: { DEFAULT: "#FFFFFF", muted: "#F7F9FC", line: "#E2E8F0" },
        text: { DEFAULT: "#0F172A", muted: "#475569" },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
        latin: ["var(--font-latin)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "16px", control: "12px" },
      boxShadow: { card: "0 12px 32px rgb(10 22 40 / 0.10)" },
      maxWidth: { page: "1140px" },
    },
  },
};
export default preset;
