var bot18 = global.BOT18

/*
  launcher.getAuth(cb)

  - Prompts for ZalgoNet email/password at first startup,
      requests an auth_token from ZalgoNet, and
      caches it at ~/.bot18/auth.json
  - Subsequent API calls include auth_token in headers,
      to bind to the associated user account and claimed codes.
*/

module.exports = function getAuth (cb) {
  var r = require('path').resolve
  var fs = require('fs')
  var debug = require('debug')('launcher')
  var prompt = require('cli-prompt')
  var linkify = require('linkify-terminal')
  var chalk = require('chalk')
  var conf = bot18.conf
  if (bot18.cmd.dev_engine) {
    // Skip auth if we already have a local engine.
    return cb()
  }
  // Determine our auth status with ZalgoNet.
  // Check for cached auth_token.
  fs.readFile(r(conf.home, 'auth.json'), {encoding: 'utf8'}, function (err, auth_json) {
    if (err && err.code !== 'ENOENT') {
      return cb(err)
    }
    if (auth_json) {
      // We have a cached auth_token, validate it with ZalgoNet
      try {
        bot18.auth = JSON.parse(auth_json)
        debug(chalk.grey('Using cached auth: ~/.bot18/auth.json'))
      }
      catch (e) {
        debug(chalk.red('Error parsing cached auth at ~/.bot18/auth.json'))
        return getNewAuth()
      }
      if (bot18.cmd.offline) {
        // Skip validation, avoid connection to ZalgoNet.
        return cb()
      }
      debug(chalk.grey('Validating cached auth with ZalgoNet - Please stand by...'))
      bot18.lib.mr_get('https://code.bot18.net/auth/' + bot18.auth.user_info.username, function (err, resp, body) {
        if (err) {
          return cb(new Error('Your network connection is down. Please try again later.'))
        }
        switch (resp.statusCode) {
          case 200:
            if (body && body.authorized) {
              // We good.
              bot18.auth = body
              withAuth()
            }
            else {
              cb(new Error('Unreadable response from ZalgoNet. The REST API may have changed, or your DNS may be tampered with.'))
            }
            return
          case 403:
            // Invalid or expired auth_token.
            return getNewAuth()
          case 400:
            return cb(new Error('Invalid request to ZalgoNet. The REST API may have changed.'))
          case 429:
            return cb(new Error('Your IP (' + body.request_ip + ') is making too many requests/sec to ZalgoNet. (Limit is ' + body.max_reqs_per_sec + ' reqs/sec, your reqs/sec: ' + (body.reqs_blocked + 1) + ')'))
          case 500:
          default:
            return cb(new Error('ZalgoNet is temporarily down. Please try again later.'))
        }
      })
    }
    else {
      getNewAuth()
    }
  })
  // Request ZalgoNet credentials from stdin.
  function getNewAuth () {
    debug(' ' + chalk.yellow.inverse(' Beep Boop, This is Bot18! '))
    if (!bot18.auth) {
      debug(chalk.yellow('      I\'m performing intial setup to connect your ') + chalk.cyan('ZalgoNet') + chalk.yellow(' account.'))
      debug(chalk.yellow('      Your information will be handled securely and encrypted whenever possible.'))
      debug(chalk.yellow('      If you don\'t have a ') + chalk.cyan('ZalgoNet') + chalk.yellow(' account yet, sign up at: ') + chalk.green(linkify('https://bot18.net/register', {pretty: true})))
      //debug('      Here\'s a tip: enter "guest" for a 15-minute Bot18 trial!'.cyan)
    }
    else {
      debug(chalk.yellow('      Your cached auth token expired, so I\'m trying to reconnect your ') + chalk.cyan('ZalgoNet') + chalk.yellow(' account.'))
      debug(chalk.yellow('      Please re-enter your ') + chalk.cyan('ZalgoNet') + chalk.yellow(' credentials so we can authorize you:'))
    }
    console.error()
    getCreds()
  }
  function getCreds () {
    ;(function promptForUsername () {
      prompt(chalk.grey('  Username: (CTRL-C to exit)') + '\n      ', function (username) {
        username = (username || '').trim()
        if (!username) {
          return promptForUsername()
        }
        if (username.toLowerCase() === 'guest') {
          return withCreds('guest', 'uNl3AsH tHe ZaLG0')
        }
        // Check if username exists.
        debug(chalk.grey('Searching ') + chalk.cyan('ZalgoNet') + chalk.grey(' - Please stand by...'))
        bot18.lib.mr_get('https://code.bot18.net/auth/' + username, {query: {check_username: true}}, function (err, resp, body) {
          if (err) {
            return cb(new Error('Your network connection is down. Please try again later.'))
          }
          switch (resp.statusCode) {
            case 200:
              if (body && body.exists === true) {
                // Username is ok.
                debug(chalk.grey('Username ') + chalk.yellow(body.username) + chalk.green(' found.'))
                return setTimeout(promptForPassword, 0)
                break
              }
              else {
                debug(chalk.grey('Username ') + chalk.yellow(username) + chalk.red(' not found!'))
                return setTimeout(promptForUsername, 0)
              }
            case 429:
              return cb(new Error('Your IP (' + body.request_ip + ') is making too many requests/sec to ZalgoNet. (Limit is ' + body.max_reqs_per_sec + ' reqs/sec, your reqs/sec: ' + (body.reqs_blocked + 1) + ')'))
            case 500:
            default:
              // Server Error.
              return cb(new Error('ZalgoNet is temporarily down. Please try again later.'))
          }
          function promptForPassword () {
            prompt.password(chalk.grey('  Password:') + '\n      ', function (password) {
              password = (password || '').trim()
              if (!password) {
                return promptForPassword()
              }
              withCreds(username, password)
            })
          }
        })
      })
    })()
  }
  // Log into ZalgoNet using username/password.
  function withCreds (username, password) {
    var opts = {
      data: {
        password: password,
        pubkey: bot18.pubkey.pubkey
      }
    }
    debug(chalk.grey('Authenticating - Please stand by...'))
    bot18.lib.mr_post('https://code.bot18.net/auth/' + username, opts, function (err, resp, body) {
      if (err) {
        return cb(new Error('Your network connection is down. Please try again later.'))
      }
      switch (resp.statusCode) {
        case 200:
          if (body && body.authorized) {
            // We good.
            bot18.auth = body
            withAuth()
          }
          else {
            cb(new Error('Unreadable response from ZalgoNet. The REST API may have changed, or your DNS may be tampered with.'))
          }
          return
        case 403:
          // Bad password.
          debug(chalk.red('Bad password.'))
          return getCreds()
        case 400:
          return cb(new Error('Invalid request to ZalgoNet. The REST API may have changed.'))
        case 429:
          return cb(new Error('Your IP (' + body.request_ip + ') is making too many requests/sec to ZalgoNet. (Limit is ' + body.max_reqs_per_sec + ' reqs/sec, your reqs/sec: ' + (body.reqs_blocked + 1) + ')'))  
        case 500:
        default:
          return cb(new Error('ZalgoNet is temporarily down. Please try again later.'))
      }
    })
  }

  function withAuth () {
    debug(chalk.green('Success!') + chalk.grey(' You are logged into ') + chalk.cyan('ZalgoNet') + chalk.grey(' as: ') + chalk.yellow(bot18.auth.user_info.username))
    debug(chalk.grey('Updating ~/.bot18/auth.json (chmod 0600)'))
    fs.writeFile(r(conf.home, 'auth.json'), JSON.stringify(bot18.auth, null, 2), {encoding: 'utf8', mode: parseInt('0600', 8)}, function (err) {
      if (err) return cb(err)
      cb()
    })
  }
}