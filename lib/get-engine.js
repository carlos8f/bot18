/*

lib.getEngine(conf, cb)

  - A Bot18 unlock code is required,
      purchased from https://bot18.net/
  - Initiates the activation process, sending you an
      e-mail with an activation link if you're using the
      code for the first time.
  - Polls bot18.net for activation success (code marked as "used")
  - Upon activation, engine distribution is downloaded from https://code.bot18.net/
      Download is validated against master Bot18 pubkey defined in conf.master_pubkey
      Uses D. J. Bernstein's NaCl library, See https://github.com/carlos8f/salty
      Engine code is decrypted using Curve25519, Salsa20, and Poly1305.
  - The result is cached to disk in encrypted, packed form by the key:
      ~/.bot18/builds/{sha1(code + pubkey + request_ip + engine_version + branch + tag)}.bot18
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

var launcher_version = 'v' + require('../package.json').version
var getWallet = require(path.resolve(__dirname, 'get-wallet'))

module.exports = function (conf, cb) {
  var last_status
  if (!conf.branch) {
    conf.branch = 'master'
  }
  // Load local Salty wallet.
  getWallet(conf, function (err, wallet) {
    if (err) return cb(err)

    // String representation of our Salty pubkey.
    var pubkey = wallet.pubkey.toString()

    // Check the unlock code's license status.
    var opts = {
      query: {
        pubkey: pubkey
      },
      headers: {
        // Send our npm bot18 version for analytics, upgrade notices.
        'user-agent': 'bot18/' + launcher_version
      }
    }
    if (conf.channel) {
      opts.query.channel = conf.channel
    }
    if (conf.tag) {
      opts.query.tag = conf.tag
    }

    debug('Fetching license status from bot18.net - Please stand by...'.grey)
    mr('https://code.bot18.net/status/' + conf.code, opts, function (err, resp, body) {
      if (err) return cb(err)
      if (resp.statusCode !== 200) {
        switch (resp.statusCode) {
          case 410:
            return cb(new Error('A valid download token is required.'))
          case 411:
            err = new Error('This download token is invalid or has expired.')
            return cb(err)
          case 412:
            err = new Error('This download token is authorized to a different IP address.')
            return cb(err)
          case 500:
            err = new Error('The licensing system is malfunctioning. Please try again later.')
            return cb(err)
          case 400:
          case 404:
            debug(body)
            err = new Error('Invalid unlock code. Purchase unlock codes at https://bot18.net/')
            return cb(err)
          default:
            err = new Error('Engine download failed (Error code: SPRINGOF' + resp.statusCode + ')')
            return cb(err)
        }
      }
      // Now that we have the remote_ip, create the local engine cache key.
      var cache_key = crypto.createHash('sha1')
        .update(conf.code)
        .update(pubkey)
        .update(body.request_ip)
        .update(body.current_engine_version)
        .update(conf.branch)
        .update(conf.tag || '')
        .digest('hex')

      // Local engine cache as an absolute file path.
      var p = path.resolve(conf.home, 'builds', cache_key + '.bot18')

      if (body.ok) {
        // Check for the cached engine.
        fs.stat(p, function (err, stat) {
          if (err && err.code === 'ENOENT') {
            // Cache miss.
            debug('No cached engine build found in ~/.bot18/builds'.grey)
            debug('Fetching current engine build from bot18.net - Please stand by...'.grey)
            // 150ms delay for rate-limiting (hard limit is 100ms)
            setTimeout(pollStatus, 150)
          }
          else if (err) {
            return cb(err)
          }
          else {
            // Cache hit.
            debug(('Using cached engine at ~/.bot18/builds/' + cache_key + '.bot18').grey)
            var saltyStream = fs.createReadStream(p)
            returnEngine(saltyStream, stat.size)
          }
        })
      }
      else {
        // Initiate the activation process.
        // 150ms delay for rate-limiting (hard limit is 100ms)
        setTimeout(pollStatus, 150)
      }

      // On a cache miss, fetch an engine build from code.bot18.net.
      function pollStatus () {
        var opts = {
          data: {
            pubkey: wallet.pubkey.toString(),
            branch: conf.branch,
            tag: conf.tag
          },
          headers: {
            // Send our npm bot18 version for analytics, upgrade notices.
            'user-agent': 'bot18/' + launcher_version
          }
        }
        mr.post('https://code.bot18.net/auth/' + conf.code, opts, function (err, resp, body) {
          if (err) return cb(err)
          if (resp.statusCode !== 200) {
            switch (resp.statusCode) {
              case 410:
                err = new Error('A valid unlock code is required. Purchase unlock codes at https://bot18.net/')
                return cb(err)
              case 413:
                return cb(new Error('A valid pubkey is required.'))
              case 414:
                return cb(new Error('Invalid pubkey.'))
              case 411:
                return cb(new Error('You specified an invalid branch. Use `master` branch.'))
              case 412:
                return cb(new Error('Tags are not supported yet. Use `master` branch instead.'))
              case 415:
                err = new Error('This unlock code was not found in our system.')
                return cb(err)
              case 416:
              case 403:
                err = new Error('You do not have permission to use this unlock code.')
                return cb(err)
              case 404:
                // Not Found.
                err = new Error('This unlock code was not found in our system.')
                return cb(err)
              case 417:
                err = new Error('There was an error determining your remote IP address. Please contact info@bot18.net so we can work this out.')
                return cb(err)
              case 429:
                err = new Error('Your IP (' + body.remote_ip + ') is being rate-limited for making too many requests/sec. Please retry in ' + body.retry_in + 'ms.')
                return cb(err)
              case 500:
                // Server Error.
                err = new Error('The licensing server at code.bot18.net is malfunctioning. Please try again later.')
                return cb(err)
              default:
                err = new Error('License authorization failed (Error code: WINTEROF' + resp.statusCode + ')')
                return cb(err)
            }
          }
          if (body.license_status !== last_status) {
            process.stderr.write('\n')
            switch (body.license_status) {
              case 'waiting_for_activation':
                if (last_status) return setTimeout(pollStatus, 5000)
              case 'sent_activation_email':
                debug('We sent an activation e-mail to ' + body.email + ', please open it and click the "Approve and Complete Setup" button.')
                last_status = body.license_status
                return setTimeout(pollStatus, 5000)
              case 'active':
                var code_p = path.resolve(conf.home, 'code')
                if (!fs.existsSync(code_p)) {
                  debug('Creating ~/.bot18/code'.grey)
                  fs.writeFileSync(code_p, conf.code + '\n', {mode: parseInt('0600', 8)})
                  debug('Success! Your license is now ACTIVE. Enjoy Bot18! ~Carlos'.yellow)
                }
                break;
              default:
                err = new Error('Your license status is: ' + body.license_status + '. You may not be able to launch Bot18 at this time.')
                return cb(err)
            }
          }

          // We're approved! Cache the result and load the engine...
          mr(body.download_url, {stream: true}, function (err, resp, body) {
            if (err) {
              return cb(err)
            }
            if (resp.statusCode !== 200) {
              switch (resp.statusCode) {
                case 410:
                  err = new Error('A valid download token is required.')
                  return cb(err)
                case 411:
                  err = new Error('This download token has expired or does not exist. Please try again.')
                  return cb(err)
                case 412:
                  err = new Error('Your IP has changed between consecutive API requests. You are unable to download the Bot18 engine at this time.')
                  return cb(err)
                case 500:
                  // Server Error.
                  err = new Error('The licensing server at code.bot18.net is malfunctioning. Please try again later.')
                  return cb(err)
                default:
                  return cb(new Error('Engine download failed (Error code: SUMMEROF' + resp.statusCode + ')'))
              }
            }
            returnEngine(body, parseFloat(resp.headers['content-length']))
            // also async pipe to the local cache location.
            body.pipe(fs.createWriteStream(p, {mode: parseInt('0600', 8), flags: 'w+'}))
          })
        })
      }
    })

    function returnEngine (saltyStream, totalLength) {
      var jsChunks = []
      var verified = false
      var saltyHeader
      var packedSize = 0
      salty.decrypt(saltyStream, wallet, totalLength)
        .once('header', function (header) {
          if (header['from-salty-id'] === conf.master_pubkey) {
            verified = true
            saltyHeader = header
          }
        })
        .on('data', function (buf) {
          packedSize += buf.length
        })
        .once('error', function (err) {
          debug('decrypt err', err)
          cb(new Error('Error decrypting/verifying engine download. The download might\'ve been corrupted or pirated. (Error code: BOWIE)'))
        })
        .pipe(zlib.createGunzip())
        .once('error', function (err) {
          debug('gunzip err', err)
          cb(new Error('Error decompressing engine download. The download might\'ve been corrupted. (Error code: CASEYJONES)'))
        })
        .on('data', function (buf) {
          jsChunks.push(buf)
        })
        .once('end', function () {
          if (!verified) {
            return cb(new Error('The engine download was signed with a pubkey different from conf.master_pubkey. It may have been tampered with.'))
          }
          var src = Buffer.concat(jsChunks).toString('utf8')
          var script = new vm.Script(src, {filename: 'bot18_engine.vm'})
          function engine () {
            // Open up stdin unless --non_interactive specified.
            if (!conf.non_interactive) {
              readline.emitKeypressEvents(process.stdin)
              if (process.stdin.setRawMode) {
                process.stdin.setRawMode(true)
              }
            }
            return script.runInThisContext({filename: 'bot18_engine.vm'})
          }
          debug(('Engine decrypted successfully!').grey)
          debug(('             Packed size: ' + bytes(packedSize) + ' (' + (((src.length / packedSize) - 1) * 100).toFixed(0) + '% compression)').grey)
          debug(('           Unpacked Size: ' + bytes(src.length)).grey)
          debug(('        Launcher Version: v' + require(path.resolve(__dirname, '..', 'package.json')).version).grey)
          debug(('          Engine Version: ' + saltyHeader['x-bot18-engine-version']).grey)
          debug(('             SHA256 Hash: ' + saltyHeader['hash']).grey)
          debug(('             From Pubkey: ' + saltyHeader['from-salty-id']).grey)
          debug(('Signature from @carlos8f: ' + saltyHeader['signature']).grey)
          console.error()
          cb(null, engine)
        })
    }
  })
}