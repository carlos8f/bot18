/*

lib.getEngine(conf, cb)

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

var salty = require('salty')
var mr = require('micro-request')
var vm = require('vm')
var colors = require('colors')
var zlib = require('zlib')
var moment = require('debug')
var debug = require('debug')('activation')
var path = require('path')
var fs = require('fs')
var crypto = require('crypto')
var debug = require('debug')('launcher')
var readline = require('readline')
var bytes = require('bytes')
var getWallet = require(path.resolve(__dirname, 'get-wallet'))
var _get = require('lodash.get')

module.exports = function (conf, cb) {
  var last_status
  // Ensure we're logged into ZalgoNet.
  getWallet(conf, function (err, conf) {
    if (err) return cb(err)

    conf.channel = (conf.channel || 'stable').toLowerCase()

    // Check the local engine cache.
    var etag = _get(conf, 'auth.channels.' + conf.channel + '.etag', null)
    if (etag) {
      var p = path.resolve(conf.home, 'builds', etag + '.bot18')
      fs.stat(p, function (err, stat) {
        if (err && err.code === 'ENOENT') {
          // Cache miss.
          fetchEngine()
        }
        else if (err) {
          return cb(err)
        }
        else {
          // Cache hit.
          debug(('Using cached engine at ~/.bot18/builds/' + etag + '.bot18').grey)
          returnEngine(fs.createReadStream(p), stat.size)
        }
      })
    }
    else {
      fetchEngine()
    }

    function fetchEngine () {
      debug('Compiling bot18_engine.vm ('.grey + conf.channel.grey + ', '.grey + _get(conf, 'auth.channels.' + conf.channel + '.current_version').grey + ') - Please stand by...'.grey)
      var opts = {
        headers: {
          'x-bot18-auth': conf.auth.auth_token,
          'user-agent': process.env.BOT18_LAUNCHER_VERSION
        },
        query: {
          channel: conf.channel
        },
        stream: true
      }
      mr('https://code.bot18.net/dl/' + conf.auth.user_info.username, opts, function (err, resp, body) {
        if (err) {
          return cb(new Error('Your network connection is down. Please try again later.'))
        }
        switch (resp.statusCode) {
          case 200:
            returnEngine(body, parseInt(resp.headers['content-length'], 10))
            if (resp.headers['etag']) {
              // also async pipe to the local cache location.
              var cache_p = path.join('builds', resp.headers['etag'] + '.bot18')
              debug('Caching engine to ~/.bot18/'.grey + cache_p.grey + ' (chmod 0600)'.grey)
              body.pipe(fs.createWriteStream(path.resolve(conf.home, cache_p), {mode: parseInt('0600', 8)}))
            }
            return
          case 400:
            return cb(new Error('Invalid request to ZalgoNet. The REST API may have changed.'))
          case 403:
            var err = new Error('Authorization expired. Please log in again.')
            err.retry = true
            return cb(err)
          case 404:
            return cb(new Error('Invalid engine distribution channel. Please choose either "stable", "unstable", or "free".'))
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
      salty.decrypt(saltyStream, conf.wallet, totalLength)
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
          debug('decrypt err'.red, err)
          cb(new Error('Error decrypting/verifying engine download. The download might\'ve been corrupted or pirated. (Error code: BOWIE)'))
        })
        .pipe(zlib.createGunzip())
        .once('error', function (err) {
          debug('gunzip err'.red, err)
          cb(new Error('Error decompressing engine download. The download might\'ve been corrupted. (Error code: CASEYJONES)'))
        })
        .on('data', function (buf) {
          jsChunks.push(buf)
        })
        .once('end', function () {
          if (!verified) {
            debug('saltyHeader'.red, conf.saltyHeader)
            return cb(new Error('The engine download was signed with a pubkey different from conf.master_pubkey. It may have been tampered with. (Error code: TWINPEAKS)'))
          }
          var src = Buffer.concat(jsChunks).toString('utf8')
          try {
            var script = new vm.Script(src, {filename: 'bot18_engine.vm'})
          }
          catch (e) {
            debug('init err', e)
            return cb(new Error('Error initializing engine. (Error code: BATMAN)'))
          }
          function engine () {
            console.error()
            debug('Handing control over to bot18_engine.vm. HOLD ONTO YOUR BUTTS!'.cyan)
            console.error()
            console.error('                                       ' + ' ---- '.yellow.inverse)
            console.error()
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
              return script.runInThisContext({filename: 'bot18_engine.vm'})
            }
            catch (e) {
              debug('engine init err'.red, e)
              debug('Engine exception. (Error code: DOGMA)'.red)
              process.exit(42)
            }
          }
          debug(('             Engine decrypted successfully!').yellow)
          debug(('             Packed Size: ' + bytes(packedSize) + ' (' + (((src.length / packedSize) - 1) * 100).toFixed(0) + '% compression)').grey)
          debug(('           Unpacked Size: ' + bytes(src.length)).grey)
          debug(('        Launcher Version: v' + require(path.resolve(__dirname, '..', 'package.json')).version).grey)
          debug('          Engine Version: '.grey + conf.saltyHeader['x-bot18-engine-version'].yellow + ' ('.grey + conf.saltyHeader['x-bot18-channel'].cyan + ')'.grey)
          debug(('             SHA256 Hash: ' + conf.saltyHeader['hash']).grey)
          debug(('             From Pubkey: ' + conf.saltyHeader['from-salty-id']).grey)
          debug(('Signature from @carlos8f: ' + conf.saltyHeader['signature']).grey)
          console.error()
          cb(null, engine)
        })
    }
  })
}