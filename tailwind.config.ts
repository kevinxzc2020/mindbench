import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff4ef",
          100: "#ffe5da",
          200: "#ffc5ae",
          400: "#ff8b70",
          500: "#dc4b32",
          600: "#bd3926",
          700: "#982e20",
          900: "#492319",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace"],
      },
      animation: {
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "bounce-in": "bounceIn 0.5s ease-out",
        "shake": "shake 0.7s cubic-bezier(.36,.07,.19,.97) both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "10%, 90%": { transform: "translate(-2px, -1px) rotate(-0.5deg)" },
          "20%, 80%": { transform: "translate(4px, 2px) rotate(0.7deg)" },
          "30%, 50%, 70%": { transform: "translate(-6px, 3px) rotate(-0.8deg)" },
          "40%, 60%": { transform: "translate(6px, -2px) rotate(0.6deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
