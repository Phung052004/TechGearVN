/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F52BA", // Xanh chủ đạo
        secondary: "#E02424", // Đỏ nổi bật
        dark: "#111827", // Màu nền tối (cho Navbar)
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      // === THÊM PHẦN NÀY ===
      animation: {
        "glow-slow": "glow 2s ease-in-out infinite alternate", // Hiệu ứng 2s lặp lại
      },
      keyframes: {
        glow: {
          "0%": {
            boxShadow: "0 0 5px rgba(15, 82, 186, 0.5)",
            transform: "scale(1)",
          },
          "100%": {
            boxShadow: "0 0 20px rgba(15, 82, 186, 0.8)",
            transform: "scale(1.05)",
          },
        },
      },
    },
  },
  plugins: [],
};
