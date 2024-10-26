// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {},
    },
    plugins: [],
    theme: {
      extend: {
        colors: {
          customYellow: '#f6e099',
          customPink: 'rgb(238,174,202)',
          customBlue: 'rgb(56,138,235)'
        },
        backgroundImage: {
          'pink-blue-radial': 'radial-gradient(circle, rgba(238,174,202,1) 13%, rgba(56,138,235,1) 98%)'
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
        },
      },
    },
  };