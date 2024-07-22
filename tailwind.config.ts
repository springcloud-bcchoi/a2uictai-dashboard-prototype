import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        'blink-animation': {
          '0%, 100%': { color: 'inherit', backgroundColor: 'inherit' },
          '50%': { color: '#ff0000', backgroundColor: '#ffff00' }, // 깜빡일 때 색상 변경
        },
      },
      animation: {
        'blink': 'blink-animation 1s steps(5, start) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
