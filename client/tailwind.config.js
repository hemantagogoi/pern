export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59'
        }
      },
      boxShadow: {
        soft: '0 18px 70px rgba(17, 94, 89, 0.14)'
      }
    }
  },
  plugins: []
};
