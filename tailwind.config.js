module.exports = {
  purge: ['./resources/**/*.blade.php', './resources/**/*.js'],
  darkMode: false,
  theme: {
    extend: {
      rotate: {
        '180': '180deg',
      },
      maxHeight: {
        '0': '0',
        '96': '24rem', // untuk slide-down menu
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
}
