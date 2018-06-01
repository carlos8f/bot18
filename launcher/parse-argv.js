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
    .description('Launch the Bot18 multi-pair cryptocurrency trading engine. Bot18 is a component of Zalgo.net')
    .option('--channel <stable|unstable|trial>', 'Select the engine distribution channel. (Default: stable)')
    .option('--conf <in-path>', 'Path to a customized configuration file.')
    .option('--save <out-path>', 'Save current setup and exit. ("home" will save to ~/.bot18/config.js)')
    .option('--login', 'Log into ZalgoNet, cache an auth token, and exit.')
    .option('--logout', 'Destroy cached auth token and exit.')
    .option('--clear', 'Clear caches and exit.')
    .option('--drop_sessions', 'Delete stored sessions and exit.')
    .option('--headless', 'Do not launch a built-in webserver/GUI.')
    .option('--non_interactive', 'Ignore key commands.')
    .option('--reset_profit', 'Reset profit/loss calculation to zero.')
    .option('--offline', 'Do not check for engine updates, just run the cached engine.')
    .option('--no_telemetry', 'Disable telemetry to ZalgoNet. CLOUD/SWARM features will be unavailable.')
    .option('--dev_engine <path>', 'Run a dev copy of the engine.')
    .option('--debug', 'Enable detailed output to stderr.')
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
  // Apply --channel override (overrides all conf definitions):
  if (cmd.channel) {
    bot18.conf.channel = cmd.channel
  }
  cb()
}