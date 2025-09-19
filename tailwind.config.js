/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0ecff',
          200: '#c2d8ff',
          300: '#99bbfa',
          400: '#7095f2',
          500: '#5775e6',
          600: '#4259d4',
          700: '#3446b0',
          800: '#2e3d8f',
          900: '#2b3775'
        }
      }
    },
  },
  plugins: [],
};
