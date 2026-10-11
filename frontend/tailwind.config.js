/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F0",
        ink: "#0F1C33",
        navy: {
          50: "#F0F3FA",
          100: "#D9E0F0",
          200: "#B3C1E0",
          500: "#2A3B66",
          700: "#1B2A49",
          900: "#0F1C33",
        },
        accent: "#4C4FD6",
        scam: "#D93636",
        warn: "#E59A0F",
        safe: "#2E9E5B",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Hind Siliguri"', '"Noto Sans Devanagari"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "24px",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 28, 51, 0.06)",
        card: "0 10px 40px rgba(15, 28, 51, 0.08)",
        navy: "0 8px 24px rgba(27, 42, 73, 0.15)",
      },
    },
  },
  plugins: [],
}