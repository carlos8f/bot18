var bot18 = global.BOT18

module.exports = function (save_p, cb) {
  var r = require('path').resolve
  var fs = require('fs')
  var defaults = require(r(__dirname, '..', 'bot18.defaults.json'))
  defaults.pkg = bot18.pkg
  fs.readFile(r(__dirname, '..', 'bot18.config-sample.js.hbs'), {encoding: 'utf8'}, function (err, tpl) {
    if (err) {
      return cb(err)
    }
    require('lodash.defaultsdeep')(bot18.conf, defaults)
    var out = require('handlebars').compile(tpl)(defaults)
    var target_p = save_p === 'home' ? r(bot18.conf.home, 'config.js') : r(process.cwd(), save_p)
    bot18.debug('launcher')(('Writing ' + target_p).grey)
    fs.writeFile(target_p, out, {encoding: 'utf8'}, function (err) {
      if (err) {
        return cb(err)
      }
      cb(null, target_p)
    })
  })
}