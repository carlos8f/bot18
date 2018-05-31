var bot18 = global.BOT18

/*
  lib.getWallet(cb)

  - Creates ~/.bot18 directory if it doesn't exist
  - Creates an anonymous, unencrypted Salty wallet at ~/.bot18/id_salty
      (used for verifying downloads from ZalgoNet)
  - Prompts for ZalgoNet email/password at first startup,
      requests an auth_token from ZalgoNet, and
      caches it at ~/.bot18/auth_token
  - Subsequent API calls include auth_token in headers,
      to bind to the associated user account and claimed codes.
*/

module.exports = function getWallet (cb) {
  var path = require('path')
  var r = path.resolve
  var fs = require('fs')
  var debug = require('debug')('launcher')
  var pempal = require('pempal')
  var salty = require('salty')
  var async = require('async')
  var conf = bot18.conf
  // set up the settings dir if it doesn't exist.
  fs.stat(conf.home, function (err, stat) {
    if (err && err.code === 'ENOENT') {
      debug('Creating ~/.bot18 (chmod 0700)'.grey)
      fs.mkdir(conf.home, parseInt('0700', 8), function (err) {
        if (err) return cb(err)
        debug('Creating ~/.bot18/config.js (chmod 0600)'.grey)
        require(r(__dirname, 'save-conf'))('home', function (err) {
          if (err) return cb(err)
          debug('Creating ~/.bot18/builds (chmod 0700)'.grey)
          fs.mkdir(r(conf.home, 'builds'), parseInt('0700', 8), function (err) {
            if (err) return cb(err)
            withHome()
          })
        })
      })
    }
    else if (err) {
      return cb(err)
    }
    else {
      withHome()
    }
  })

  // Set up the local Salty wallet (ephemeral, unencrypted,
  //   used for verifying downloads from ZalgoNet)
  function withHome () {
    var id_salty_path = r(conf.home, 'id_salty')
    fs.stat(id_salty_path, function (err, stat) {
      if (err && err.code === 'ENOENT') {
        // generate a new Salty wallet.
        debug('Creating ~/.bot18/id_salty (chmod 0600)'.grey)
        bot18.wallet = salty.wallet.create()
        bot18.pubkey = bot18.wallet.pubkey
        fs.writeFile(id_salty_path, bot18.wallet.toPEM() + '\n', {mode: parseInt('0600', 8)}, function (err) {
          if (err) return cb(err)
          debug('Creating ~/.bot18/id_salty.pub (chmod 0644)'.grey)
          fs.writeFile(r(conf.home, 'id_salty.pub'), bot18.pubkey.pubkey + '\n', {mode: parseInt('0644', 8)}, function (err) {
            if (err) return cb(err)
            cb()
          })
        })
      }
      else if (err) {
        return cb(err)
      }
      else {
        fs.readFile(id_salty_path, {encoding: 'utf8'}, function (err, id_salty) {
          if (err) return cb(err)
          try {
            var pem = pempal.decode(id_salty, {tag: 'SALTY WALLET'})
            bot18.wallet = salty.wallet.parse(pem.body)
          }
          catch (e) {
            return cb(e)
          }
          fs.readFile(r(conf.home, 'id_salty.pub'), {encoding: 'utf8'}, function (err, id_salty_pub) {
            if (err) return cb(err)
            bot18.wallet.pubkey = salty.pubkey.parse(id_salty_pub)
            bot18.pubkey = bot18.wallet.pubkey
            cb()
          })
        })
      }
    })
  }
}