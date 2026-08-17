/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1120', // dark navy/black
        surface: '#1E293B',
        accent: '#06B6D4', // cyan
        'accent-hover': '#0891B2',
        status: {
          safe: '#10B981', // green
          warning: '#F59E0B', // yellow
          alert: '#F97316', // orange
          critical: '#EF4444', // red
        }
      }
    },
  },
  plugins: [],
}
