import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        panel: "#121B2E",
        panel2: "#16213a",
        line: "#26365a",
        off: "#F4F7FB",
        // v2: lifted, clearer greys — sec (secondary text), mut (muted). slate/dim
        // kept for the admin/login screens.
        sec: "#C2CEE2",
        mut: "#94A2BC",
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
