/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bpjs: {
          green: '#009B4C',
          'green-dark': '#007A3D',
          'green-light': '#E6F6ED',
          blue: '#0F4C81',
          'blue-dark': '#092C4C',
          'blue-light': '#EBF2F8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
