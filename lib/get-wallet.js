/*
lib.getWallet(conf, cb)

  - Creates conf.home directory if it doesn't exist
  - Prompts for unlock code at first startup,
      and caches it at conf.home/code
  - Caches a salty wallet at conf.home/id_salty
      used for verifying downloads from code.bot18.net
  - Master pubkey is a constant defined with conf.master_pubkey

*/

var salty = require('salty')
var fs = require('fs')
var path = require('path')
var prompt = require('cli-prompt')
var debug = require('debug')('launcher')
var pempal = require('pempal')

module.exports = function (conf, cb) {
  if (!conf.code) {
    fs.readFile(path.resolve(conf.home, 'code'), {encoding: 'utf8'}, function (err, code) {
      if (err && err.code !== 'ENOENT') {
        return cb(err)
      }
      conf.code = (code || '').trim()
      if (conf.code) {
        withCode()
      }
      else {
        promptForCode()
      }
    })
  }
  else {
    withCode()
  }
  function promptForCode () {
    debug('You need a Bot18 Unlock Code to proceed. You can purchase an Unlock Code at https://bot18.net/'.red)
    prompt('Enter your 8-digit Bot18 Unlock Code (case does not matter):\n\t'.grey, function (code) {
      code = code.trim().toUpperCase()
      if (!code.match(/^[A-Z0-9]{8}$/)) {
        console.error('Invalid unlock code. '.red)
        return promptForCode()
      }
      conf.code = code
      withCode()
    })
  }
  function withCode () {
    // set up the settings dir if it doesn't exist.
    fs.stat(conf.home, function (err, stat) {
      if (err && err.code === 'ENOENT') {
        debug('Creating ~/.bot18'.grey)
        fs.mkdir(conf.home, parseInt('0700', 8), function (err) {
          if (err) return cb(err)
          fs.mkdir(path.resolve(conf.home, 'builds'), parseInt('0700', 8), function (err) {
            if (err) return cb(err)
            withHome()
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
  }
  function withHome () {
    var id_salty_path = path.resolve(conf.home, 'id_salty')
    fs.stat(id_salty_path, function (err, stat) {
      if (err && err.code === 'ENOENT') {
        // generate a new Salty wallet.
        debug('Creating ~/.bot18/id_salty'.grey)
        var wallet = salty.wallet.create()
        fs.writeFile(id_salty_path, wallet.toPEM() + '\n', {mode: parseInt('0600', 8)}, function (err) {
          if (err) return cb(err)
          debug('Creating ~/.bot18/id_salty.pub'.grey)
          fs.writeFile(path.resolve(conf.home, 'id_salty.pub'), wallet.pubkey.toString() + '\n', {mode: parseInt('0644', 8)}, function (err) {
            if (err) return cb(err)
            withWallet(wallet)
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
            var wallet = salty.wallet.parse(pem.body)
          }
          catch (e) {
            return cb(e)
          }
          fs.readFile(path.resolve(conf.home, 'id_salty.pub'), {encoding: 'utf8'}, function (err, id_salty_pub) {
            if (err) return cb(err)
            wallet.pubkey = salty.pubkey.parse(id_salty_pub)
            withWallet(wallet)
          })
        })
      }
    })
  }
  function withWallet (wallet) {
    cb(null, wallet)
  }
}