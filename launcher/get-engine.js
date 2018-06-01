var bot18 = global.BOT18

/*
  lib.getEngine(cb)

  - Fetches encrypted/signed engine code from ZalgoNet.
  - Requires a valid auth_token.
  - Comes in 3 flavors (selected by conf.channel):
        "stable" (default, beta tested)
        "unstable" (latest, untested dev build),
        "free" (crippled free version)
  - The result is cached to disk in encrypted, packed form by the key:
      ~/.bot18/builds/{sha1(auth_token + pubkey + request_ip + channel + current_engine_version)}.bot18
  - If any of these variables change, a new engine is downloaded.
  - All downloads from bot18.net will be signed with master Bot18 pubkey defined in conf.master_pubkey
      Uses D. J. Bernstein's NaCl library, and my crypto library Salty: https://github.com/carlos8f/salty
      Engine code is decrypted using Curve25519, Salsa20, and Poly1305.
  - Decrypts to plain JS, creates a VM, and returns cb(err, engine)
      ...where `engine` is a callable JS function to invoke main() of the Bot18 engine VM.
*/

module.exports = function getEngine (cb) {
  var salty = require('salty')
  var vm = require('vm')
  var zlib = require('zlib')
  var debug = bot18.debug('launcher')
  var path = require('path')
  var r = path.resolve
  var fs = require('fs')
  var readline = require('readline')
  var bytes = require('bytes')
  var _get = require('lodash.get')
  var chalk = require('chalk')
  var conf = bot18.conf
  if (bot18.cmd.dev_engine) {
    // Support linking to a local engine copy for development.
    conf.channel = 'dev'
    bot18.engine = function dev_main () {
      try {
        require(r(process.cwd(), bot18.cmd.dev_engine))
      }
      catch (e) {
        debug('dev_main err', e)
        return cb(new Error('initializing dev engine. (Error code: THEJOKER)'))
      }
    }
    return cb()
  }
  conf.channel = (conf.channel || 'stable').toLowerCase()
  // Check the local engine cache.
  bot18.etag = _get(bot18, 'auth.channels.' + conf.channel + '.etag', null)
  if (bot18.etag) {
    var p = r(conf.home, 'builds', bot18.etag + '.bot18')
    fs.stat(p, function (err, stat) {
      if (err && err.code === 'ENOENT') {
        // Cache miss.
        bot18.engine_cache = 'miss'
        if (bot18.cmd.offline) {
          return cb(new Error('No cached engine found. Unable to run offline.'))
        }
        fetchEngine()
      }
      else if (err) {
        return cb(err)
      }
      else {
        // Cache hit.
        bot18.engine_cache = 'hit'
        debug(chalk.grey('Using cached engine at ~/.bot18/builds/' + bot18.etag + '.bot18'))
        returnEngine(fs.createReadStream(p), stat.size)
      }
    })
  }
  else {
    fetchEngine()
  }
  function fetchEngine () {
    debug(chalk.grey('Compiling bot18_engine.vm (' + conf.channel + ', ' + _get(bot18, 'auth.channels.' + conf.channel + '.current_version', '') + ') - Please stand by...'))
    var opts = {
      query: {
        channel: conf.channel
      },
      stream: true
    }
    bot18.lib.mr_get('https://code.bot18.net/dl/' + bot18.auth.user_info.username, opts, function (err, resp, body) {
      if (err) {
        return cb(new Error('Your network connection is down. Please try again later.'))
      }
      switch (resp.statusCode) {
        case 200:
          returnEngine(body, parseInt(resp.headers['content-length'], 10))
          if (resp.headers['etag']) {
            // also async pipe to the local cache location.
            var cache_p = path.join('builds', resp.headers['etag'] + '.bot18')
            debug(chalk.grey('Caching engine to ~/.bot18/' + cache_p + ' (chmod 0600)'))
            body.pipe(fs.createWriteStream(r(conf.home, cache_p), {mode: parseInt('0600', 8)}))
          }
          return
        case 400:
          return cb(new Error('Invalid request to ZalgoNet. The REST API may have changed.'))
        case 403:
          var err = new Error('Authorization expired. Please log in again.')
          return require(r(__dirname, 'get-auth'))(cb)
        case 404:
          return cb(new Error('Invalid engine distribution channel. Please choose either "stable", "unstable", or "trial".'))
        case 429:
          return cb(new Error('Your IP (' + body.request_ip + ') is making too many requests/sec to ZalgoNet. (Limit is ' + body.max_reqs_per_sec + ' reqs/sec, your reqs/sec: ' + (body.reqs_blocked + 1) + ')'))
        case 500:
          return cb(new Error('Engine code failed to compile. Please contact info@bot18.net and report this.'))
        default:
          return cb(new Error('Unreadable response from ZalgoNet. The REST API may have changed or your DNS may be tampered with.'))
      }
    })
  }

  function returnEngine (saltyStream, totalLength) {
    var jsChunks = []
    var verified = false
    var saltyHeader
    var packedSize = 0
    salty.decrypt(saltyStream, bot18.wallet, totalLength)
      .once('header', function (header) {
        conf.saltyHeader = header
        if (header['from-salty-id'] === conf.master_pubkey) {
          verified = true
        }
      })
      .on('data', function (buf) {
        packedSize += buf.length
      })
      .once('error', function (err) {
        debug(chalk.red('decrypt err'))
        cb(new Error('Error decrypting/verifying engine download. The download might\'ve been corrupted or pirated. (Error code: BOWIE)'))
      })
      .pipe(zlib.createGunzip())
      .once('error', function (err) {
        debug(chalk.red('gunzip err'))
        cb(new Error('Error decompressing engine download. The download might\'ve been corrupted. (Error code: CASEYJONES)'))
      })
      .on('data', function (buf) {
        jsChunks.push(buf)
      })
      .once('end', function () {
        if (!verified) {
          debug(chalk.red('saltyHeader'), conf.saltyHeader)
          return cb(new Error('The engine download was signed with a pubkey different from conf.master_pubkey. It may have been tampered with. (Error code: TWINPEAKS)'))
        }
        var src = Buffer.concat(jsChunks).toString('utf8')
        try {
          var script = new vm.Script(src, {filename: 'bot18_engine.vm'})
        }
        catch (e) {
          debug('init err', e)
          return cb(new Error('initializing engine. (Error code: BATMAN)'))
        }
        function engine () {
          /*
          console.error()
          debug('Handing control over to bot18_engine.vm -- HOLD ONTO YOUR BUTTS!'.cyan)
          console.error()
          console.error('                                       ' + ' ---- '.yellow.inverse)
          */
          console.error() // A little spacing.
          // Record keystrokes unless --non_interactive specified.
          if (!conf.non_interactive) {
            readline.emitKeypressEvents(process.stdin)
            if (process.stdin.setRawMode) {
              process.stdin.setRawMode(true)
            }
          }
          else {
            process.stdin.setRawMode(false)
          }
          try {
            // Hand over the conf and pass control of the current process to the VM.
            // We can only do this safely now that the signature has been verified.
            global.BOT18_CONF = conf
            var context = vm.createContext({
              global: global,
              console: console,
              process: process,
              require: require,
              Buffer: Buffer,
              BOT18: bot18,
              // @todo: use lolex for these?
              setImmediate: setImmediate,
              setInterval: setInterval,
              setTimeout: setTimeout
            })
            return script.runInContext(context, {filename: 'bot18_engine.vm'})
          }
          catch (e) {
            debug(chalk.red('engine init err'), e)
            debug(chalk.red('Engine exception. (Error code: DOGMA)'))
            // @todo: restart the engine for recoverable errors?
            process.exit(42)
          }
        }
        debug(chalk.yellow('             Engine decrypted successfully!'))
        debug(chalk.grey('             Packed Size: ' + bytes(packedSize).toLowerCase() + ' (' + (((src.length / packedSize) - 1) * 100).toFixed(0) + '% compression)'))
        debug(chalk.grey('           Unpacked Size: ' + bytes(src.length).toLowerCase()))
        debug(chalk.grey('        Launcher Version: v' + require(r(__dirname, '..', 'package.json')).version))
        debug(chalk.grey('          Engine Version: ') + chalk.yellow(conf.saltyHeader['x-bot18-engine-version']) + chalk.grey(' (') + chalk.cyan(conf.saltyHeader['x-bot18-channel']) + chalk.grey(')'))
        debug(chalk.grey('             SHA256 Hash: ' + conf.saltyHeader['hash']))
        debug(chalk.grey('             From Pubkey: ' + conf.saltyHeader['from-salty-id']))
        debug(chalk.grey('Signature from @carlos8f: ' + conf.saltyHeader['signature']))
        console.error()
        bot18.engine = engine
        cb()
      })
  }
}