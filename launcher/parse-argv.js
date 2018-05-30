var bot18 = global.BOT18

/*
  lib.parseArgv()

  - Defines valid args for `bot18` command.
  - Parses args using commander.js
  - Applies any flags/overrides to bot18.conf
*/

module.exports = function (cb) {
  var cmd = bot18.cmd = require('commander')
  cmd._name = 'bot18'
  cmd
    .version('v' + bot18.pkg.version)
    .arguments('[pair-specs...]')
    .description('Launch the Bot18 multi-pair cryptocurrency trading engine.')
    .option('--channel <stable|unstable|trial>', 'Select the engine distribution channel. (Default: stable)')
    .option('--conf <in-path>', 'Path to a customized configuration file.')
    .option('--save <out-path>', 'Save current setup to a new config file and exit. (chmod: 0600, "home" to write to ~/.bot18/config.js)')
    .option('--login', 'Log into ZalgoNet, cache an auth token, and exit.')
    .option('--logout', 'Destroy cached auth tokens and exit.')
    .option('--clear', 'Clear caches and exit.')
    .option('--drop_sessions', 'Clear stored sessions and exit.')
    .option('--headless', 'Do not launch a built-in webserver/GUI.')
    .option('--non_interactive', 'Ignore key commands.')
    .option('--reset_profit', 'Reset profit/loss calculation to zero.')
    .option('--debug', 'Enable detailed output to stderr')

  // Parse CLI args.
  cmd.parse(process.argv)

  // Add each arg as a pair-spec.
  // Implementation incomplete.
  bot18.conf.pairs = {}
  cmd.args.forEach(function (arg) {
    var parts = arg.split(/\s*:\s*/)
    if (parts.length === 1) {
      parts = ['*', parts[0]]
    }
    // @todo: handle +/- task operators and wildcards.
    bot18.conf.pairs[parts[0] || '*'] = parts[1]
  })
  // Apply channel override (overrides all conf definitions):
  if (cmd.channel) {
    bot18.conf.channel = cmd.channel
  }
  // Add boolean flags to conf first (overrides all conf definitions):
  cmd.flags = ['headless', 'non_interactive', 'reset_profit', 'debug']
  cmd.flags.forEach(function (k) {
    if (cmd[k] === true) {
      bot18.conf[k] = true
    }
  })
  cb()
}