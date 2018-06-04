var bot18 = global.BOT18
var r = require('path').resolve

module.exports = {
  // meta
  _ns: 'motley',
  _folder: 'conf',

  // site overrides
  '@site.port': parseInt(bot18.conf.port_mapping.gui.split(':')[1], 10),
  '@site.title': 'Bot18 - The 🔥 Crypto Trading Bot - Unleash The Zalgo!',

  // middleware overrides
  'middleware.templ{}': {
    watch: true
  },
  'middleware.buffet{}': {
    watch: true
  },

  'db.json{}': {
    'path': r(bot18.conf.home, 'db.json'),
    'hashKeys': false
  },

  // other variables
  'auth.strength': 12,

  '@console': {
    'silent': true,
    'colors': true,
    'timestmap': false
  },

  'middleware.templ.root{}': {
    'cwd': r(bot18.__dirname, 'gui')
  },
  'middleware.buffet.root{}': {
    'cwd': r(bot18.__dirname, 'gui')
  }
}