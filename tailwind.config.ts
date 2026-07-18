import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        panel: "#121B2E",
        panel2: "#16213a",
        line: "#1F2B45",
        off: "#F4F7FB",
        slate: "#7C8AA3",
        dim: "#5a6784",
        blue: "#1E90FF",
        orange: "#FF8D1E",
        good: "#3fbf8f",
        bad: "#e0776b",
      },
      fontFamily: {
        disp: ["var(--font-poppins)", "system-ui", "sans-serif"],
        body: ["var(--font-open-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 24px 70px rgba(0,0,0,.5)",
      },
    },
  },
  plugins: [],
};

export default config;
