var bot18 = global.BOT18

/*
  launcher.getConf(cb)

  - Assembles conf variables from various sources.
*/

module.exports = function getConf (cb) {
  var conf = bot18.conf
  var path = require('path')
  var r = require('path').resolve
  var fs = require('fs')
  conf.paths = []
  // 0. --conf <path> (already added in applyOverrides())
  if (bot18.cmd.conf) {
    conf.paths.push({
      name: 'custom',
      path: r(process.cwd(), bot18.cmd.conf)
    })
  }
  conf.paths = conf.paths.concat([
    // 1. `pwd`/bot18.config.js if present:
    {name: 'local', path: r(process.cwd(), 'bot18.config.js')},
    // 2. ~/.bot18/config.js if present:
    {name: 'home', path: r(require('home-or-tmp'), '.bot18', 'config.js')},
    // 3. Install dir bot18.config.js if present:
    {name: 'install', path: r(__dirname, '..', 'bot18.config.js')},
    // 4. Fall back to defaults defined in bot18.config-sample.js
    {name: 'defaults', path: r(__dirname, '..', 'bot18.config-sample.js')}
  ])
  // Function for loading a conf file and merging its vars.
  function loadConf (p, cb) {
    p.loaded = false
    p.vars = {}
    fs.exists(p.path, function (exists) {
      if (exists) {
        try {
          p.vars = require(p.path)
        }
        catch (e) {
          return cb(e)
        }
        p.loaded = true
      }
      return cb(null, p.vars)
    })
  }
  require('async').mapSeries(conf.paths, loadConf, function (err, results) {
    if (err) return cb(err)
    require('lodash.defaultsdeep').apply(null, [conf].concat(results))
    // Use debug module for bot output messages. Outputs to stderr.
    // bot18 --debug will output all debug() calls including those from dependencies.
    if (!process.env.DEBUG) {
      process.env.DEBUG = conf.debug ? '*' : 'launcher,startup,stdin,execute,errors'
    }
    if (!process.env.DEBUG_DEPTH) {
      process.env.DEBUG_DEPTH = '10'
    }
    if (!process.env.DEBUG_SHOW_HIDDEN) {
      process.env.DEBUG_SHOW_HIDDEN = 'true'
    }
    // We need to require debug module AFTER process.env.DEBUG is finalized.
    // It's convenient to keep it cached on bot18 so we don't have to
    // require it from every file.
    bot18.debug = require('debug')
    // Expand "~/" to home-or-tmp() in paths defined in the conf.
    var home = require('home-or-tmp')
    Object.keys(conf).forEach(function (k) {
      if (typeof conf[k] === 'string') {
        conf[k] = conf[k].replace(/\~\//g, home + '/')
      }
    })
    // Execute the --save subcommand if present.
    if (bot18.cmd.save) {
      require(r(__dirname, 'save-conf'))(bot18.cmd.save, function (err, out_p) {
        if (err) {
          return cb(err)
        }
        process.exit(0)
      })
    }
    else {
      cb()
    }
  })
}