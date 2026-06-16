/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#e8eff7',
          sidebar: '#1a2538',
          card: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
