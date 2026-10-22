/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './assets/js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: '#183D32',
        ivory: '#F4F0E6',
        earth: '#B77745',
        charcoal: '#242A26',
        sage: '#D7E2D1',
        'dark-bg': '#171F1B',
        'dark-surface': '#24372E',
        'dark-text': '#F2EEE5',
        'dark-accent': '#D8A071',
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1400px',
      },
    },
  },
  plugins: [],
};
