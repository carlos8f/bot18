var bot18 = global.BOT18

/*
  lib.printMotd()

  - Prints the ZalgoNet MOTD to stderr.
*/

module.exports = function (cb) {
  var r = require('path').resolve
  var chalk = require('chalk')
  if (bot18.conf.motd) {
    var linkify = require('linkify-terminal')
    require('fs').readFile(r(__dirname, '..', 'motd.txt'), {encoding: 'utf8'}, function (err, motd) {
      if (err) {
        return cb(err)
      }
      console.error('\n' + chalk.cyan(linkify(motd, {pretty: true})) + '\n')
      cb()
    })
  }
  else {
    cb()
  }
}