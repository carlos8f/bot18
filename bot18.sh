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

// Sanity check, reject old node versions.
if (!global || !global.process || !global.process.versions || !global.process.versions.node) {
  console.error('You are running something that doesn\'t seem to be Node.js. Bot18 only runs on Node. Get it at https://nodejs.org/')
  process.exit(18)
}
var semver = require('semver')
var colors = require('colors')
if (semver.gt('8.3.0', process.versions.node)) {
  console.error(('You are running a Node.js version older than 8.3.x. Please upgrade via https://nodejs.org/').red)
  process.exit(1)
}

// Load engine dependencies.
var path = require('path')
  , fs = require('fs')
  , _defaultsDeep = require('lodash.defaultsdeep')

// Define the command.
var cmd = require('commander')
cmd._name = 'bot18'
cmd
  .arguments('[pair_specs...]')
  .description('Launch the Bot18 multi-pair trading engine, with built-in webserver exposing a GUI on port 8018. This is the main entry point.')
  .option('--code <code>', 'Specify an unlock code. Overrides the one saved at ~/.bot18/code')
  .option('--channel <stable|unstable|free>', 'Select the Engine distribution channel (Default: stable)')
  .option('--conf <path>', 'path to optional conf overrides file')
  .option('--tasks <task-list>', 'override tasks for all selected pairs (e.g.: --tasks "watch,+record")')
  .option('--strats <strat-list>', 'override strats for all selected pairs (e.g.: --strat "sar,macd")')
  .option('--headless', 'Do not launch a built-in webserver GUI.')
  .option('--non_interactive', 'ignore key commands')
  .option('--reset_profit', 'reset profit calculation to zero')
  .option('--reset_inventory', 'appraise starting asset balance at market value')
  .option('--debug', 'show detailed output')

// Parse CLI input.
cmd.parse(process.argv)

// Assemble conf variables.
var overrides, local, home, install, defs, conf = {}

// Conf order of importance:

// 1. arbitrary overrides with --conf <path>:
if (cmd.conf) {
  try {
    overrides = require(path.resolve(process.cwd(), cmd.conf))
  }
  catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e
    overrides = {}
  }
}

// 2. Local bot18.config.js if present:
try {
  local = require(path.resolve(process.cwd(), 'bot18.config'))
}
catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e
  local = {}
}

// 3. Home dir bot18.config.js if present:
try {
  home = require(path.resolve(require('home-or-tmp'), '.bot18', 'bot18.config'))
}
catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e
  home = {}
}

// 4. Install dir bot18.config.js if present:
try {
  install = require(path.resolve(__dirname, 'bot18.config'))
}
catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND' && e.code !== 'ENOENT') throw e
  install = {}
}

// 5. Hard-coded defaults:
defs = require(path.resolve(__dirname, 'bot18.config-sample'))

// Merge them all in order.
_defaultsDeep(conf, overrides, local, defs)

// Use debug() for bot output.
if (!process.env.DEBUG) {
  process.env.DEBUG = conf.debug ? '*' : 'launcher,activation,startup,stdin,execute,errors'
}
// Load the debug module now that we have the conf.debug flag parsed.
var debug = require('debug')('launcher')

// Apply code override.
if (cmd.code) {
  conf.code = cmd.code
}

// Apply task/strat overrides.
conf.tasks_override = cmd.tasks
conf.strat_override = cmd.strats

// Add each arg as a pair-spec.
cmd.args.forEach(function (arg) {
  var parts = arg.split(/\s*:\s*/)
  if (parts.length < 2) {
    debug(('Invalid arg: ' + arg).red)
    process.exit(2)
  }
  conf.pairs[parts[0]] = parts[1]
})

// Add boolean flags to conf.
;['headless', 'reset_profit', 'reset_inventory', 'debug'].forEach(function (k) {
  if (cmd[k] === true) {
    conf[k] = cmd[k]
  }
})

// Append the commander.js instance to the conf for later convenience.
conf.cmd = cmd

// ZalgoNet MOTD.
if (conf.motd) {
  fs.readFile(path.resolve(__dirname, 'motd.txt'), {encoding: 'utf8'}, function (err, motd) {
    if (err) {
      debug(('Error reading MOTD: ' + err.message).red)
    }
    else {
      console.error('\n' + motd + '\n')
    }
    runEngine()
  })
}
else {
  runEngine()
}

// Get the latest engine code from code.bot18.net, verify its signature, and run it.
function runEngine () {
  require(path.resolve(__dirname, 'lib', 'get-engine'))(conf, function (err, engine) {
    if (err) {
      debug((err.message || ('Error: ' + (err.stack || err))).red)
      if (err.retry) {
        return setTimeout(runEngine, 2000)
      }
      return process.exit(3)
    }
    engine()
  })
}
