![Bot18](https://bot18.net/assets/bot18_logo_light.png)

## Welcome to ZalgoNet.

Bot18 is a commercial high-frequency cryptocurrency trading bot developed by [Zenbot](https://github.com/DeviaVir/zenbot) creator [carlos8f](https://github.com/carlos8f). More information available from the [bot18.net website](https://bot18.net/).

## Description

Bot18 is "online" software, designed to be invoked without installing. The only pre-requisite is having Node.js >= 8.3.0 installed. The recommended way to launch is with:

```sh
$ npx bot18
```

## Configuration

- Copy [this example](https://gist.githubusercontent.com/carlos8f/93210d8347d74cc2fa1ffa1a4558aba5/raw/bot18.config-sample.js) to "bot18.config.js" in the same folder where you run your `npx bot18` command, to configure the bot. Make sure you `chmod 600 bot18.config.js` to protect your confirgured API keys/passwords from exposure due to liberal filesystem permissions.
- You can also specify a specific conf file with `npx bot18 --conf <path-to-bot18.config.js>`, and/or define an account-wide conf at `~/.bot18/bot18.config.js`.
- Bonus points if you have [MongoDB](https://www.mongodb.com) installed! You can activate data streaming to Mongo by setting `c.mongo.enabled=true` in your `bot18.config.js` file.

## Beta Features (So far)

The current version is an early proof-of-concept, and supports:

  - Monitoring live trade streams from [Bitfinex](https://www.bitfinex.com/) and [Coinbase Pro](https://pro.coinbase.com/) simultaneously.
  - Supports [Coinbase Pro](https://pro.coinbase.com/) (formerly known as GDAX) live trading. Tracks your account balance and reports profit/loss when you trade.
  - Press the "l" key to list available key commands. Supports executing manual trades when yellow "M" is displayed at the end of the console columns.
  - Enter "A" (capitalized) to enable auto-trading. The early auto-trading strategy is based on orderbook snapshot power-imbalance, and is highly experimental. **Currently, the Beta's auto-trading strategy is not recommended for serious trading.**

## Follow Updates and Keep In Touch

- For announcements and progress updates, [follow @bot18_net on Twitter!](https://twitter.com/bot18_net)
- To support Bot18 development, [Buy a shirt, hoodie or mug!](https://shop.bot18.net/)
- For inquiries, contact us through the [https://bot18.net/](bot18.net) website.

Cheers and happy trading,

—-[@carlos8f](https://github.com/carlos8f), May 27th 2018

Salty ID: `3t27msBTpN2Mn2LP68ZFLUUo3AN37aoGerUFPHdus9tFJg3hw7upmnY9c7nQ9fv1EFFF9nxiU9JzFSYPRAnx8Age`
