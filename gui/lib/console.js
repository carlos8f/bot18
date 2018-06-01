var bot18 = global.BOT18

module.exports = function container (get, set) {
  var conf = get('conf.console')
  var cluster = require('cluster')
  var d = bot18.debug('startup')
  var ch = require('chalk')
  return {
    _prefixArgs: function (args) {
      if (conf.workerId) {
        if (cluster.isMaster && Object.keys(cluster.workers).length) {
          var msg = '[master]'
          if (conf.colors) msg = ch.green(msg)
          args.unshift(msg)
        }
        else if (cluster.isWorker) {
          var msg = '[worker:' + cluster.worker.id + ']'
          if (conf.colors) msg = ch.cyan(msg)
          args.unshift(msg)
        }
      }
      if (conf.timestamp) {
        var date = new Date()
        var tzMatch = date.toString().match(/\((.*)\)/)
        var msg = date.toLocaleString() + ' ' + tzMatch[1]
        if (conf.colors) msg = ch.grey(msg)
        args.unshift(msg)
      }
    },
    log: function () {
      if (conf.silent) return
      var args = [].slice.call(arguments)
      this._prefixArgs(args)
      if (conf.colors) msg = ch.grey(msg)
      d.apply(d, args)
    },
    error: function () {
      if (conf.silent) return
      var args = [].slice.call(arguments)
      this._prefixArgs(args)
      var msg = '[ERROR]'
      if (conf.colors) msg = ch.red(msg)
      args.unshift(msg)
      d.apply(d, args)
    }
  }
}