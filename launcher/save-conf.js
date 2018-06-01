var bot18 = global.BOT18

module.exports = function (save_p, cb) {
  var r = require('path').resolve
  var fs = require('fs')
  var vm = require('vm')
  var chalk = require('chalk')
  var defaults = require(r(__dirname, '..', 'bot18.defaults.json'))
  defaults.pkg = bot18.pkg
  fs.readFile(r(__dirname, '..', 'bot18.config-sample.js.hbs'), {encoding: 'utf8'}, function (err, tpl) {
    if (err) {
      return cb(err)
    }
    var tpl_func = require('handlebars').compile(tpl)
    var conf_copy = JSON.parse(JSON.stringify(bot18.conf))
    require('lodash.defaultsdeep')(conf_copy, defaults)
    var subconfig_keys = ['pair_config', 'strat_config']
    Object.keys(conf_copy).forEach(function (k) {
      // Since Handlebars doesn't output null or booleans,
      //   convert them to string equivalents.
      function convertValue (val, is_flat) {
        // special keys that don't convert to JSON.
        if (!is_flat && k.match(/^(mongo|pkg)$/)) {
          if (typeof val === 'object' && val !== null) {
            var ret = {}
            Object.keys(val).forEach(function (k) {
              ret[k] = convertValue(val[k])
            })
            return ret
          }
          else {
            return convertValue(val, true)
          }
        }
        else if (val === true) {
          return 'true'
        }
        else if (val === false) {
          return 'false'
        }
        else if (val === null) {
          return 'null'
        }
        else {
          // Fall back to indented JSON for complex types.
          return JSON.stringify(val, null, 2)
        }
      }
      conf_copy[k] = convertValue(conf_copy[k])
    })
    conf_copy.copied_from = bot18.user_agent
    var out = tpl_func(conf_copy)
    // Test out the resulting source code.
    try {
      var script = new vm.Script(out)
    }
    catch (e) {
      bot18.debug('launcher')(chalk.red('save conf err'), e)
      return cb(new Error('Caught syntax error, refusing to write result.'))
    }
    var target_p = save_p === 'home' ? r(bot18.conf.home, 'config.js') : r(process.cwd(), save_p)
    bot18.debug('launcher')(chalk.grey('Writing ' + target_p))
    fs.writeFile(target_p, out, {encoding: 'utf8'}, function (err) {
      if (err) {
        return cb(err)
      }
      cb(null, target_p)
    })
  })
}