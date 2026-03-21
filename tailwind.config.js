/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B00',
          dark: '#CC5500',
          light: '#FF8C38',
        },
        surface: {
          DEFAULT: '#111111',
          raised: '#1a1a1a',
          border: '#2a2a2a',
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
