/*
  Bot18 Configuration (copied from v0.3.3)
  https://bot18.net/

  The file bot18.config-sample.js represents the defaults.
  Extend/override these variables by (in order of importance):

      1. "custom": Specifying an arbitrary-location copy of this file with
         `npx bot18 --conf /path/to/my/bot18.config.js`
      2. "local": Copying this file to `bot18.config.js` in the same
         folder that your run the `npx bot18` command from
      3. "home": Copying this file to `~/.bot18/config.js`
      4. "global": Copying this file to `bot18.config.js` in the same
         folder as bot18.config-sample.js, probably this will be
         /usr/local/lib/node_modules/bot18

  Bot18 will attempt to load configuration from all 4 locations,
  and merge the results in order of importance.

  Additionally, you can save your current setup to
  a new configuration file, by adding the `--save` argument:

    npx bot18 [--conf <my-custom-config.js>] --save ~/.bot18/config.js

  This will copy bot18.config-sample.js to ~/.bot18/config.js, and replace
  the defaults with your merged settings from all 4 possible config locations.
*/

// Export a hash-map of configuration variables.
var c = module.exports = {}


/*
  Section 1: Paths And Startup Options.
*/

// Engine version to use. Defaults to latest stable build.
//   Also available: "unstable" (latest dev build) and
//   "trial" (crippled free version)
c.channel = 'stable'
// Directory for storing persistent settings, etc.
//   Files written here will be chmod 0600, subdirectories 0700.
//   "~/" will be expanded to your home directory's absolute path,
//   or a tmp directory, as a fallback.
c.home = '~/.bot18'
// Display ZalgoNet MOTD at startup. (Usually a news bulletin from @carlos8f)
c.motd = true

/*
  Section 2: Multi-Pair And Task Selection.

    Bot18 runs a single master process which manages
    all your subproceses for each pair/exchange you want to run.

    Pairs are selected using a hash-map defined in c.pairs:

      "exchange-pair-selector" -> "comma-separated-task-list"

    Both key and value can contain glob patterns. See:
    https://npmjs.org/package/minimatch

    For example, to watch all USD pairs on Bitfinex and GDAX,
    and record data streams from all GDAX pairs to MongoDB, use:

      c.pairs = {
        "{bfx,gdax}.*-usd": "watch",
        "gdax.*": "+record"
      }

    These pair selections can be overriden by CLI args. The above
    can be specified with the same effect by starting with:

      npx bot18 '{bfx,gdax}.*-usd:watch' 'gdax.*:+record'

    For each exchange/asset/currency combo selected, a worker
    subprocess will be spawned to perform actions in the task-list
    relating to the target exchange.

    Valid selector examples:

      bfx.btc-* (all Bitcoin-base pairs on Bitfinex)
      *.*-jpy (Japanese Yen-quoted pairs on all exchanges)
      *.* (or just "*", selects all supported pairs and exchanges)

    Valid tasks include:

      (daemon tasks)

      watch:    Monitor public trade streams, candles, and stats.
      ob:       Keep a realtime orderbook mirror.
      record:   Record trades and orderbook snapshots to mongodb.
      trade:    Keep track of account balance/portfolio,
                  personal orders/fills, and enable (manual or auto) trading.
      auto:     Perform trades recommended by the strategy, without human input.
                  Turn on with "A" (capitalized) during `trade` task.
                  Turn off with "m" (any case) during `auto` task.

      (utility tasks)

      list:     List available selectors/strategies and exit.
      balance:  Output balances and exit.
      sim:      Run simulations and exit.
      train:    Train machine-learning models and exit.
      export:   Export data and exit.

    So to auto-trade LTC on Kraken using the macd strategy:

  Tips:

  - Tasks can also have URL-encoded variables attached to them,
      e.g.'*:trade?auto_short=true&buy_volume=1.5'
  - Tasks can also be strategy names, to enable that strategy on the
      selected pairs, e.g. '*:+macd?crossover=0.235'
  - Putting "+" before a task name adds it to the task-list, "-" removes it.
  - Wildcards "*" are valid in both keys and values.
*/
c.pairs = {
  'bfx.*-usd': 'watch',
  'gdax.*-usd': 'watch',
}

/**
  You can also override ANY configuration variables using
  exchange-pair-selectors, including wildcards as demonstrated above.

  For example:

    c.pair_config = {
      'bfx.*-eur': {
        'bfx.wallet': 'margin',
        'bfx.key': 'my-EUR-api-key',
        'bfx.secret': 'my-EUR-api-secret'
      }
    }

  ..which will use the margin wallet and a special API key for
  EUR pairs on Bitfinex.
*/
//Define your pair-specific overrides below:
c.pair_config = {
}

/*
  Section 3: Strategy selection.

    Bot18 runs can run multiple strategies at once, mapped
    arbitrarily to the selected pairs.

    Strategies are selected using a hash-map defined in c.strats:

      "exchange-pair-selector" -> "comma-separated-strategy-name-list"

    For example, to run the Parabolic SAR and MACD strategies on
    the Bitfinex BCH/USD pair, use:

      c.strats = {
        "bfx.bch-usd": ""
      }

    NOTE:

    Bot18 will NOT perform trades automatically, unless you specify
    the task "auto" in the pairs task-list.
*/
c.strats = {
  '*': 'noop',
}

/*
  Section 3: Exchange Configuration.

  Bot18 will communicate directly with crypto exchanges
  using API keys that you add here. Bot18 will not be
  able to perform trades on your behalf unles you give
  the "trade" permission (or equivalent) to your API key.
  Bot18 should also be able to "view" the account balance
  and historical orders and fills.

  DO NOT give the "transfer" permission to your API keys
  for use with Bot18, unless you really, really, really
  know what you're doing. You DON'T WANT un-authorized
  people transferring funds out of your exchange account
  if your bot18.config.js gets intercepted!!!
*/

// to enable GDAX trading, enter your API credentials:
c.gdax = {}
c.gdax.key = 'YOUR-API-KEY'
c.gdax.b64secret = 'YOUR-BASE64-SECRET'
c.gdax.passphrase = ''

// to enable Bitfinex trading, enter your API credentials:
c.bfx = {}
c.bfx.key = 'YOUR-API-KEY'
c.bfx.secret = 'YOUR-SECRET'
// May use 'exchange' or 'margin' wallet balances
c.bfx.wallet = 'exchange'


/*
  Section 4: MongoDB Configuration.

  Bot18 can optionally stream data to MongoDB if you
  set c.mongo.enabled=true, and specify your mongod connection details.
  For information on MongoDB, visit https://www.mongodb.com/
*/
c.mongo = {}
c.mongo.enabled = false
c.mongo.db = 'bot18'
c.mongo.host = process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost'
c.mongo.port = 27017
c.mongo.username = null
c.mongo.password = null
// Or to use a specific connection string,
// uncomment the following line:
//c.mongo.server_uri = 'mongodb://user@password:host/db?params'
c.mongo.replica_set = null
c.mongo.auth_mechanism = null

/*
  Section 5: Internationalization and Localization

  Bot18 can display in the language and locality of your
  choosing, if there is a translation available.
  c.locality is an ISO 639-1 2-letter lowercased language code,
  and optionally, a dash and a 2-letter uppercased country code.

  Currently, there are no translations other than English.
*/
c.locality = 'en'


/*
  Section 6: Notifiers.

  Bot18 can trigger notifications via 3rd party services,
  if you enter your API keys here.

*/
// Notifiers:
c.notifiers = {}

// Pushover.net
c.notifiers.pushover = {}
c.notifiers.pushover.enabled = false
c.notifiers.pushover.api_token = 'YOUR-API-TOKEN'
c.notifiers.pushover.user_key = 'YOUR-USER-KEY'


/*
  Section 7: Internal Configuration.

  These variables don't usually need changing,
  but they are here in case you want to have a custom setup.
*/
// Internal port mapping.
c.port_mapping = {
  'engine': '127.0.0.1:1818',
  'gui': '127.0.0.1:8018',
}
// Timeout durations.
c.launch_timeout = 30000
c.graceful_exit_timeout = 1000
// Verify engine downloads from code.bot18.net against this "master" Salty pubkey.
//   This should ALWAYS match the "Salty ID" displayed at the bottom of https://bot18.net/
//   See: https://github.com/carlos8f/salty
c.master_pubkey = '3t27msBTpN2Mn2LP68ZFLUUo3AN37aoGerUFPHdus9tFJg3hw7upmnY9c7nQ9fv1EFFF9nxiU9JzFSYPRAnx8Age'


// Overrides or additional variables can be defined on `c` below this point.
// -------------------------------------------------------------------------




























