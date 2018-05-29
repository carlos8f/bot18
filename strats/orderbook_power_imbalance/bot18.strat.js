var s = module.exports = {}

s.name = 'orderbook_power_imbalance'
s.version = 'v0.0.0'
s.author = 'Carlos Rodriguez <carlos@s8f.org>'
s.homepage = 'https://bot18.net/'

// standard size for buying
s.buy_one_size = '1.0'
// when buy_mkt is triggered, use these funds for buy
s.buy_mkt_funds = '1000.00'
// stop buying after acquiring this (size in asset)
s.max_asset = '10.0'
// position sell order just before entry with >= this size
s.ask_wall = '2.00'
// position buy order just before entry with >= this size
s.buy_wall = '5.00'
// require this for buying, if it drops below, hold
s.buy_min_vwap_pct_bias = '4.0'
// if it drops below, sell
s.sell_max_vwap_pct_bias = '1.0'
// require this for buying, if it drops below, sell
s.min_vol_bias = '0.4'
// mark up buys immediately by %
s.profit_stop = '0.3'
s.profit_stop_mkt = '0.5'

// require this amount of selling in 500ms window to trigger sell_mkt
s.sell_mkt_trigger = '20.0'
// wait this for cancels before pulling sell_mkt trigger (in ms)
s.sell_mkt_delay = 520
// if vwap_pct_bias drops below this, considered "urgent"
s.urgent_max_vwap_pct_bias = '-3.0'

// require this amount of buying in 500ms window to trigger sell_mkt
s.buy_mkt_trigger = '40.0'
// wait this for cancels before pulling buy_mkt trigger (in ms)
s.buy_mkt_delay = 520
// require vwap_pct_bias of at least this to trigger buy_mkt
s.buy_mkt_min_vwap_pct_bias = '10.0'

// failsafe cancels exchange-side
s.sell_cancel_after = 'day'
s.buy_cancel_after = 'hour'
// allow price to drop this (in currency) before considered "urgent" status
s.loss_tolerance = '1.00'
// backoff order price if diff is >= this (in currency)
s.outbid_min_backoff = '0.05'
// after buy error, wait for this (in ms) before retrying
s.buy_error_backoff = 30000
// allow this many hold periods before canceling buy order
s.buy_max_holds = 2
// calculate slippage of market order of this size (for eval)
s.bulk_vol = '100.00'
// maintain order book buffer this % of each side (for order calc)
s.book_range_pct = '2.0'
// analyze book until this % of each side (for eval)
s.book_stats_range_pct = '0.5'
// length of stats window in ms
s.window_length = 1000 * 60 * 2
// ms to wait after a successful buy, to buy again
s.buy_timeout = 60000
// ms to wait after a buy error, to buy again
s.sell_timeout = 10000
// ms to wait between timeout notifications
s.timeout_notification_timeout = 5000
// core loop intervals in ms
s.heartbeat_interval = 10000
s.heartbeat_notifications = '30m'
s.render_interval = 500
s.book_sync_interval = 400
s.balance_sync_interval = 2000
s.launch_timeout = 30000
s.graceful_exit_timeout = 1000
s.reboot_timeout = 5000
s.profit_stop_timeout = 1000
// change if ur from china or some shit
s.currency = 'USD'
// in asset
s.min_buy_notification_size = '1.0'
s.min_sell_notification_size = '1.0'
// in currency
s.min_short_notification_amt = '1.00'
