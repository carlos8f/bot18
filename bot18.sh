#!/usr/bin/env node

/*

     ...     ..              ....             .....
  .=*8888x <"?88h.       .x~X88888Hx.      .H8888888h.  ~-.
 X>  '8888H> '8888      H8X 888888888h.    888888888888x  `>
'88h. `8888   8888     8888:`*888888888:  X~     `?888888hx~
'8888 '8888    "88>    88888:        `%8  '      x8.^"*88*"
 `888 '8888.xH888x.  . `88888          ?>  `-:- X8888x
   X" :88*~  `*8888> `. ?888%           X       488888>
 ~"   !"`      "888>   ~*??.            >     .. `"88*
  .H8888h.      ?88   .x88888h.        <    x88888nX"      .
 :"^"88888h.    '!   :"""8888888x..  .x    !"*8888888n..  :
 ^    "88888hx.+"    `    `*888888888"    '    "*88888888*
        ^"**""               ""***""              ^"***"`
                    oe       u+=~~~+u.
                  .@88     z8F      `8N.
              ==*88888    d88L       98E
                 88888    98888bu.. .@*
                 88888    "88888888NNu.
                 88888     "*8888888888i
                 88888     .zf""*8888888L
                 88888    d8F      ^%888E
                 88888    88>        `88~
                 88888    '%N.       d*"
              '**%%%%%%**    ^"====="`

       (c) 2018 Carlos Rodriguez <carlos@s8f.org>
    License: MIT + Paid Unlock Code - See LICENSE.txt
                  https://bot18.net/
*/

;(function bot18_main () {
  // Sanity check.
  try {
    if (!global || !global.process || !process || !process.versions || !process.versions.node || !require || !console) {
      console.error('You are running something that doesn\'t seem to be Node.js. Bot18 only runs on Node. Get it at https://nodejs.org/')
      process.exit(1)
    }
  }
  catch (e) {
    console.error('You are running something that doesn\'t seem to be Node.js. Bot18 only runs on Node. Get it at https://nodejs.org/')
    process.exit(2)
  }
  try {
    var path = require('path')
    var pkg = require(path.resolve(__dirname, 'package.json'))
  }
  catch (e) {
    console.error('package.json for Bot18 could not be located. You are likely running a corrupt install and should try re-installing Bot18 and/or Node.js.')
    process.exit(3)
  }
  // Reject old Node versions.
  if (require('semver').gt('8.3.0', process.versions.node)) {
    console.error('You are running a Node.js version older than 8.3.x. Please upgrade via https://nodejs.org/')
    process.exit(4)
  }
  // Unleash the zalgo.
  require('colors')
  // Export global BOT18 var. This var holds literally everything.
  // It's just an easy way of state-sharing between various parts of
  // Bot18, and passing vars to the engine VM, which is pre-compiled and acts as a
  // "main() within a main()", only having access to the global scope.
  // Include a reference to require() so webpack doesn't try to shim it
  // if we call it directly from the engine code.
  // This will contain live JS instances so don't try to JSON stringify it!
  var bot18 = global.BOT18 = {
    pkg: pkg,
    require: global.require,
    conf: {},
    lib: {}
  }
  bot18.user_agent = 'bot18/v' + bot18.pkg.version
  // Perform all our warm-ups and run the engine.
  function warmup (p) {
    return require(path.resolve(__dirname, 'launcher', p))
  }
  require('async').series([
    warmup('get-lib'),
    warmup('parse-argv'),
    warmup('get-conf'),
    warmup('get-mongo'),
    warmup('print-motd'),
    warmup('get-wallet'),
    warmup('get-auth'),
    warmup('get-engine')
  ], function (err) {
    if (err) {
      var msg = (err.stack || err)
      console.error(msg.red)
      process.exit(5)
    }
    bot18.engine()
  })
})()
