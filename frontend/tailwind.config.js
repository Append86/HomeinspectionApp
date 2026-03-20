/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'append-navy': '#1d2d50',
        'append-orange': '#f39200',
      },
    },
  },
  plugins: [],
}