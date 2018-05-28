var uuid = require('uuid/v4')

module.exports = function () {
  return uuid().replace(/-/g, '')
}