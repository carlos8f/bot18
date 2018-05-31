var bot18 = global.BOT18

/**
  lib.getLib()

  - Attaches random useful stuff onto bot18.
*/

module.exports = function (cb) {
  var r = require('path').resolve
  require(r(__dirname, '..', 'lib', 'mr'))()
  cb()
}