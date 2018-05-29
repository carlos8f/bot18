/*
  Bot18 Configuration.
  https://bot18.net/

  The file bot18.config-sample.js represents the defaults.
  Extend/override these variables by (in order of importance):

      1. Specifying an arbitrary-location copy of this file with
         `bot18 --conf /path/to/my/bot18.config.js`
      2. Copying this file to "bot18.config.js" in the same
         folder that your run the `bot18` command from
      3. Copying this file to ~/.bot18/bot18.config.js
      4. Copying this file to "bot18.config.js" in the same
         folder as your Bot18 install
*/
// export a hash-map of configuration variables.
var c = module.exports = {}

/*
  Section 1: Multi-Pair selection.

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

      bot18 '{bfx,gdax}.*-usd:watch' 'gdax.*:+record'

    For each exchange/asset/currency combo selected, a worker
    subprocess will be spawned to perform actions in the task-list
    relating to the target exchange.

    Valid selector examples:

      bfx.btc-* (all Bitcoin-base pairs on Bitfinex)
      *.*-jpy (All Japanese Yen-quoted pairs on all exchanges)
      *.* (or just "*", selects all supported pairs and exchanges)

    Valid tasks include:

      (daemon tasks)

      watch:    Monitor public trade streams, candles, and stats.
      ob:       Keep a realtime orderbook mirror.
      record:   Record trades and orderbook snapshots to mongodb.
      trade:    Requires api keys, keeps track of account balance
                  and orders/fills, and enable trading.
      auto:     Start in auto-trading mode. Perform trades recommended
                  by the strategy, without human input. Toggle with "m" key.

      (utility tasks)

      list:     list available selectors/strategies and exit
      balance:  output balances and exit
      sim:      run simulations and exit
      train:    train machine-learning models and exit
      export:   export data and exit

  Tips:

  - Putting "+" before a task name adds it to the task-list, "-" removes it.
  - Wildcards "*" are valid in both keys and values.

*/
c.pairs = {
  'bfx.*-usd': 'watch',
  'gdax.*-usd': 'watch'
}

/*
  Section 2: Strategy selection.

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
  '*': 'noop'
}

/*
  Section 3: Exchange configuration.

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
c.gdax.passphrase = 'YOUR-PASSPHRASE'
// to enable Bitfinex trading, enter your API credentials:
c.bitfinex = {}
c.bitfinex.key = 'YOUR-API-KEY'
c.bitfinex.secret = 'YOUR-SECRET'
// May use 'exchange' or 'margin' wallet balances
c.bitfinex.wallet = 'exchange'

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
  Section 4: MongoDB configuration.

  Bot18 can optionally stream data to MongoDB if you
  set c.mongo.enabled=true, and specify your mongod connection details.
  For information on MongoDB, visit https://www.mongodb.com/
*/
// mongo configuration (optional)
c.mongo = {}
c.mongo.enabled = false
c.mongo.db = 'bot18'

// Must provide EITHER c.mongo.connectionString OR c.mongo.host,port,username,password
// c.mongo.connectionString = 'mongodb://u:p@host/db?params'
// The following is not needed when c.mongo.connectionString is provided:
c.mongo.host = process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost'
c.mongo.port = 27017
c.mongo.username = null
c.mongo.password = null
// when using mongodb replication, i.e. when running a mongodb cluster, you can define your replication set here; when you are not using replication (most of the users), just set it to `null` (default).
c.mongo.replicaSet = null
c.mongo.authMechanism = null


/*
  Section 5: Notifiers.

  Bot18 can trigger notifications via 3rd party services,
  if you enter your API keys here.

*/
// Notifiers:
c.notifiers = {}

// xmpp config
c.notifiers.xmpp = {}
c.notifiers.xmpp.enabled = false  // false xmpp disabled; true xmpp enabled (credentials should be correct)
c.notifiers.xmpp.jid = 'trader@domain.com'
c.notifiers.xmpp.password = 'Password'
c.notifiers.xmpp.host = 'domain.com'
c.notifiers.xmpp.port = 5222
c.notifiers.xmpp.to = 'MeMyselfAndI@domain.com'

// pushbullets config
c.notifiers.pushbullet = {}
c.notifiers.pushbullet.enabled = false // false pushbullets disabled; true pushbullets enabled (key should be correct)
c.notifiers.pushbullet.key = 'YOUR-API-KEY'
c.notifiers.pushbullet.deviceID = 'YOUR-DEVICE-ID'

// ifttt config
c.notifiers.ifttt = {}
c.notifiers.ifttt.enabled = false // false ifttt disabled; true ifttt enabled (key should be correct)
c.notifiers.ifttt.makerKey = 'YOUR-API-KEY'
c.notifiers.ifttt.eventName = 'bot18'

// slack config
c.notifiers.slack = {}
c.notifiers.slack.enabled = false
c.notifiers.slack.webhook_url = ''

// discord config
c.notifiers.discord = {}
c.notifiers.discord.enabled = false // false discord disabled; true discord enabled (key should be correct)
c.notifiers.discord.id = 'YOUR-WEBHOOK-ID'
c.notifiers.discord.token = 'YOUR-WEBHOOK-TOKEN'
c.notifiers.discord.username = '' // username
c.notifiers.discord.avatar_url = ''
c.notifiers.discord.color = null // color as a decimal

// textbelt config
c.notifiers.textbelt = {}
c.notifiers.textbelt.enabled = false // false textbelt disabled; true textbelt enabled (key should be correct)
c.notifiers.textbelt.phone = '3121234567'
c.notifiers.textbelt.key = 'textbelt'

// pushover config
c.notifiers.pushover = {}
c.notifiers.pushover.enabled = false // false pushover disabled; true pushover enabled (keys should be correct)
c.notifiers.pushover.token = 'YOUR-API-TOKEN' // create application and supply the token here
c.notifiers.pushover.user = 'YOUR-USER-KEY' // this is your own user's key (not application related)
c.notifiers.pushover.priority = '0' // choose a priority to send messages with, see https://pushover.net/api#priority

// telegram config
c.notifiers.telegram = {}
c.notifiers.telegram.enabled = false // false telegram disabled; true telegram enabled (key should be correct)
c.notifiers.telegram.bot_token = 'YOUR-BOT-TOKEN'
c.notifiers.telegram.chat_id = 'YOUR-CHAT-ID' // the id of the chat the messages should be send in


/*
  Section 6: Internal configurations.

  These variables don't usually need changing,
  but they are here in case you want to have a custom setup.
*/

// Misc stuff.
// Engine version to use. Defaults to latest stable build.
// Also available: "unstable" (latest dev build) and "free" (crippled free version)
c.channel = 'stable'
// Display ZalgoNet MOTD at startup.
c.motd = true
// Directory for storing persistent settings, etc.
// Default: ~/.bot18
c.home = require('path').resolve(require('home-or-tmp'), '.bot18')
// Internal port mapping.
c.port_mapping = {
  'engine': '127.0.0.1:1818',
  'gui': '127.0.0.1:8018'
}
// Timeout durations.
c.launch_timeout = 30000
c.graceful_exit_timeout = 1000
// Verify engine downloads from code.bot18.net against this "master" Salty pubkey.
// see: https://github.com/carlos8f/salty
c.master_pubkey = '3t27msBTpN2Mn2LP68ZFLUUo3AN37aoGerUFPHdus9tFJg3hw7upmnY9c7nQ9fv1EFFF9nxiU9JzFSYPRAnx8Age'
