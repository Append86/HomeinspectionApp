/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'append-navy': '#0F172A',   // Deep, modern slate/navy
        'append-orange': '#F59E0B', // Vibrant, readable orange
        'append-bg': '#F8FAFC',     // Soft off-white background
      },
      borderRadius: {
        'append-xl': '2rem',        // Extra rounded "bento" corners
      }
    },
  },
  plugins: [],
}