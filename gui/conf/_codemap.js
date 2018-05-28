module.exports = {
  // meta
  _ns: 'motley',
  _folder: 'conf',

  // site overrides
  '@site.port': 1818,
  '@site.title': 'Bot18 - The 🔥 Crypto Trading Bot - Unleash The Zalgo!',

  // middleware overrides
  'middleware.templ{}': {
    watch: true
  },
  'middleware.buffet{}': {
    watch: true
  },

  // other variables
  'auth.strength': 12,

  '@db.mongo': {
    url: 'mongodb://localhost:27017/bot18'
  }
}