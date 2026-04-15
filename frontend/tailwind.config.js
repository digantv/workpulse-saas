/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dafc',
          300: '#7cc2f8',
          400: '#36a6f2',
          500: '#0c8ce8',
          600: '#0070c4',
          700: '#00589f',
          800: '#064b83',
          900: '#0b3f6d',
        },
      },
      boxShadow: {
        card:
          '0 1px 2px rgba(15, 23, 42, 0.05), 0 4px 14px rgba(15, 23, 42, 0.07), 0 14px 36px rgba(15, 23, 42, 0.07)',
      },
    },
  },
  plugins: [],
};
