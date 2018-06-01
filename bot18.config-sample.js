/*
  Bot18 Configuration (copied from bot18/v0.4.20)
  https://bot18.net/

  -------

  WARNING REGARDING EXCHANGE API KEYS

  Bot18 will communicate directly with crypto exchanges
  using API keys that you add here. Bot18 will not be
  able to perform trades on your behalf unless you give
  the "trade" permission (or equivalent) to your API key.
  For full functionality, give the "view" permission to
  the key, to access account balance and historical orders
  and fills.

  DO NOT give the "transfer" or "withdraw" permission to
  your API keys for use with Bot18, unless you really,
  really, really know what you're doing. You DON'T WANT
  un-authorized people transferring funds out of your
  exchange account if your config.js gets intercepted!!!

  -------

  The file bot18.config-sample.js represents the defaults.
  These are copied to ~/.bot18/config.js when you invoke
  Bot18 for the first time.

  Extend/override these variables by (in order of importance):

      1. "custom": An arbitrary-location copy of this file, with
         `npx bot18 --conf /path/to/my/bot18.config.js`
      2. "local": Copying this file to `bot18.config.js` in the same
         folder that your run the `npx bot18` command from
      3. "home": Editing your account-wide config at `~/.bot18/config.js`

  Bot18 will attempt to load configuration from all 3 locations,
  and merge the results in order of importance.

  Additionally, you can save your current setup to
  a new configuration file, by adding the `--save` argument:

    npx bot18 --save my-custom.config.js

  This will copy bot18.config-sample.js to my-custom.config.js, replace
  the defaults with your merged settings from all 3 possible config locations,
  and chmod it 0600 all in one command. Pretty handy!
*/

// Export a hash-map of configuration variables.
var c = module.exports = {}


/*
  Section 1: Paths And Startup Options.

  Engine version to use. This takes effect only if you leave out the
  `--channel <channel>` argument. Defaults to "stable".

  Valid options:

    - `stable` -- The latest stable release. This is only available
      to ZalgoNet users who purchase a Bot18 Unlock Code.
      See: https://bot18.net/beta
    - `unstable` -- The latest dev build. You will need a `TEST` License
      in your ZalgoNet account to select this option.
    - `trial` -- A free 15-minute trial of Bot18, paper-trading mode only.
      Available to everyone, also by entering "guest" at the ZalgoNet
      login prompt.
*/
c.channel = "stable"

// Directory for storing persistent settings, etc.
//   Files written here will be chmod'ed 0600, subdirectories 0700.
//   "~/" will be expanded to your home directory's absolute path,
//   or a tmp directory, as a fallback.
c.home = "~/.bot18"

// Display ZalgoNet MOTD at startup. (Usually a news bulletin from @carlos8f)
c.motd = true

/*
  Section 2.1: Exchange-Pair selection.

    Under the hood, Bot18 uses the CCXT project for exchange abstraction.
    For a list of Exchange IDs and Symbols supported by CCXT, see this page:

      https://github.com/ccxt/ccxt/wiki/Manual

    Configuration in this file will follow the naming conventions set forth
    by the CCXT project for the following:

      - Exchange ID (a short lowercased, one-word identifier)
      - Symbol (an asset-currency pair identifer, such as `BTC/USD`)
      - API Configuration (variables such as `apiKey`, `secret`, `uid`,
        and `password`)

    In this config file, you will select exchange/asset/currency "pairs" to
    run tasks on. These are selected using a hash-map defined in c.pairs:

      c.pairs = {
        <exchange-pair-selector>: <comma-separated-task-list>
      }

    An "exchange-pair-selector" is a string in the form:

      "<ccxt_exchange_id>.<lowercased_ccxt_dashed_symbol>"

    A "lowercase_ccxt_dashed_symbol" is a string in the form:

      "{asset_id}-{currency_id}" (the CCXT Symbol with "/" replaced with "-")

    A "comma-separated-task-list" is a string in the form:

      "{bot18_task_id}[?optional&urlencoded=true&querystring=toinclude]"

    Valid tasks include:

      (daemon tasks)

      watch:    Monitor public trade streams, candles, and stats.
      ob:       Keep a realtime orderbook mirror.
      record:   Record trades and orderbook snapshots to mongodb.
      paper:    Keep a simulated account balance. Do not perform real trades.
      trade:    Keep track of your real account balance/portfolio,
                  personal orders/fills,
                  and enable REAL (manual or auto) trading.
      auto:     Perform trades recommended by the strategy, without human input.
                  Turn on with "A" (capitalized) during `trade` task.
                  Turn off with "m" (any case) during `auto` task.

      Note that "out of the box", Bot18 only enables the `watch` and `ob` tasks,
      for only Bitfinex and Coinbase Pro exchanges. It's UP TO YOU to add
      `trade` and `auto` tasks to your chosen exchange-pair selection to tell
      the bot to perform automatic real trades recommended by your
      selected strategy(s).

      (utility tasks)

      list:     List available selectors/strategies and exit.
      balance:  Output balances and exit.
      sim:      Run simulations and exit.
      train:    Train machine-learning models and exit.
      export:   Export data and exit.

    Both keys and values here can use glob patterns. See:
    https://npmjs.org/package/minimatch

    Examples

      For example, to watch all USD pairs on Kraken and GDAX, and record data
      streams from all GDAX pairs to MongoDB, use something like:

        c.pairs = {
          "{kraken,gdax}.*-usd": "watch",
          "gdax.*": "+record"
        }

      These pair selections can be overriden by CLI args (called "pair-specs",
      keys separated from values with a ":"). The above can be specified with
      the same effect by starting with:

        npx bot18 '{kraken,gdax}.*-usd:watch' 'gdax.*:+record'

      For each exchange/asset/currency combo selected, a worker
      subprocess will be spawned to perform actions in the task-list
      relating to the target exchange.

      Valid selector examples:

        bitfinex2.btc/* (all Bitcoin-base pairs on Bitfinex)
        *.*-jpy (Japanese Yen-quoted pairs on all exchanges)
        *.* (or just "*", selects all supported pairs and exchanges)

  Tips:

  - Task IDs can also have URL-encoded variables attached to them,
      e.g.'*:trade?auto_short=true&buy_volume=1.5'
  - Task IDs can also be strategy IDs (info on those below), to enable that
      strategy on the selected pair(s), e.g. '*:+macd?crossover=0.235'
  - Putting "+" before a task_id adds it to the task-list, "-" removes it.
  - Wildcards "*" are valid in both keys and values.

  Examples:

    Auto-trade LTC/USD and ETH/USD on Kraken using the macd strategy:

      npx bot18 kraken.{ltc,eth}/usd:+trade,auto,macd?crossover=0.235

*/
c.pairs = {
  "bitfinex2.*-usd": "watch,ob",
  "gdax.*-usd": "watch,ob",
  "bitfinex2.*-usdt": "watch,ob"
}

/**
  Section 2.2: Exchange API Keys and Pair-specific Config.

  You can pass configuration variables targeted at specific
  exchange-pair selectors. Incidentally, this is how you configure your
  exchange API keys.

  You can even configure multiple API keys for a given exchange,
  if you specify a specific asset/currency in
  the exchange-pair-selector.

  For example:

    c.pair_config = {
      'bitfinex2.*-eur': {
        'bitfinex2.apiKey': 'my-EUR-api-key',
        'bitfinex2.secret': 'my-EUR-api-secret'
      }
    }

  ..which will use a specific API key for EUR pairs on Bitfinex.

  Define your exchange-pair configurations below, including
  all exchange API keys Bot18 needs below (replace "YOUR-API-KEY"
  with your actual API key, etc.)
*/
c.pair_config = {
  "bitfinex2.*": {
    "bitfinex2.apiKey": "YOUR-API-KEY",
    "bitfinex2.secret": "YOUR-SECRET"
  },
  "gdax.*": {
    "gdax.apiKey": "YOUR-API-KEY",
    "gdax.secret": "YOUR-SECRET"
  }
}


/*
  Section 3: Strategy Selection And Configuration.

    A "strat" or Strategy in Bot18 slang, is a combination of
    JavaScript code and JSON files, bundled into a directory
    (and sometimes packaged as a git repository, npm package,
    or tarball). This code tells the Bot18 engine, through the
    Engine API, when to trade, and the specifics of those trades.

      - Each strat has a machine-readable ID (`strat_id`),
        consisting of lowercased alpha-numeric characters
        and underscores.
      - Each strat can define its own configuration variables,
        which can be configured below in `c.strat_config`.

    Bot18 runs can run multiple strategies at once, mapped
    arbitrarily to your exchange-pair selections.

    Strategies are selected using a hash-map defined in c.strats:

      "<exchange-pair-selector>" -> "<comma-separated-strat-id-list>"

    For example, to run the Parabolic SAR and MACD strategies on
    the Bitfinex BCH/USD pair, use something like:

      c.strats = {
        "bitfinex2.bch-usd": "sar,macd?crossover=0.18181818"
      }

    NOTE:

    Bot18 will NOT perform trades automatically, unless you specify
    the task `auto` in the exchange-pair selector's task-list,
    or enter "A" (capitalized) in your console during the `trade` task.
*/
c.strats = {
  "*": "noop"
}

/**
  You can also pass configurations to each strategy.

  For example:

    c.strat_config = {
      'macd': {
        'crossover': 1.352,
        'rsi_overbought': 85
      }
    }

  ..which will customize the `macd` strategy's configuration.
*/
//Define your strat-specific config below:
c.strat_config = {
  "noop": {
    "test_var": 1.2353
  }
}


/*
  Section 4: MongoDB Configuration.

  Bot18 can optionally stream data to MongoDB if you
  set c.mongo.enabled=true, and specify your mongod connection details.
  For information on MongoDB, visit https://www.mongodb.com/
*/
c.mongo = {}
c.mongo.enabled = true
c.mongo.db = "bot18"
c.mongo.host = process.env.MONGODB_PORT_27017_TCP_ADDR || "localhost"
c.mongo.port = 27017
c.mongo.username = null
c.mongo.password = null
// Or to use a specific connection string,
// customize and uncomment the following line:
//c.mongo.server_uri = "mongodb://user@password:host/db?params"
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
c.locality = "en"


/*
  Section 6: Notifiers.

  Bot18 can trigger notifications via 3rd party services,
  if you enter your API keys here.

*/

// Pushover.net
c.pushover = {
  "enabled": false,
  "api_token": "YOUR-API-TOKEN",
  "user_key": "YOUR-USER-KEY"
}


/*
  Section 7: Internal Configuration.

  These variables don't usually need changing,
  but they are here in case you want to have a custom setup.
*/
// Increment this number to display a whole new palette of colors.
c.color_scheme = 0
// Internal port mapping.
c.port_mapping = {
  "engine": "127.0.0.1:1818",
  "gui": "127.0.0.1:8018"
}
// Timeout durations.
c.launch_timeout = 30000
c.graceful_exit_timeout = 1000
/*
  Verify engine downloads from code.bot18.net against this "master"
  Salty pubkey.
  This should ALWAYS match the "Salty ID" displayed at the bottom
  of https://bot18.net -- See: https://github.com/carlos8f/salty
*/
c.master_pubkey = "3t27msBTpN2Mn2LP68ZFLUUo3AN37aoGerUFPHdus9tFJg3hw7upmnY9c7nQ9fv1EFFF9nxiU9JzFSYPRAnx8Age"


// Overrides or additional variables can be defined on `c` below this point.
// -------------------------------------------------------------------------




























