var bot18 = global.BOT18

module.exports = function () {
  function wrapMethod (method) {
    return function (url, opts, cb) {
      var defaults = {
        headers: {
          'user-agent': bot18.user_agent
        }
      }
      if (bot18.auth && bot18.auth.authorized && bot18.auth.auth_token) {
        defaults.headers['x-bot18-auth'] = bot18.auth.auth_token
      }
      if (typeof opts === 'function') {
        cb = opts
        opts = {}
      }
      var opts_copy = JSON.parse(JSON.stringify(opts))
      var opts_merged = require('lodash.defaultsdeep')(opts_copy, defaults)
      return require('micro-request')[method](url, opts_merged, cb)
    }
  }
  ;['get', 'post', 'put', 'delete'].forEach(function (method) {
    bot18.lib['mr_' + method] = wrapMethod(method)
  })
}