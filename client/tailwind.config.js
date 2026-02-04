/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        trello: {
          blue: '#0052CC',
          'blue-dark': '#003399',
          'blue-light': '#091E42',
          gray: '#F8F9FA',
          'gray-dark': '#5E6C84',
          green: '#61BD4F',
          red: '#EB5A46',
          orange: '#F2CC0C',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
