module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js'], 
  darkMode: 'class', 
  theme: {
    extend: {
      rotate: {
        '180': '180deg',
      },
      maxHeight: {
        '0': '0',
        '96': '24rem',
      },
    },
  },
  variants: {
    extend: {
      rotate: ['hover', 'focus'],
      maxHeight: ['responsive', 'hover'],
    },
  },
  plugins: [],
};
