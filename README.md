![Bot18](https://bot18.net/assets/bot18_logo_light.png)

Bot18 is a high-frequency cryptocurrency trading bot developed by [Zenbot](https://github.com/DeviaVir/zenbot) creator [carlos8f](https://github.com/carlos8f). More information available from the [bot18.net website](https://bot18.net/).

## BTW, This Is A Beta.

Keep in mind this is the BETA RELEASE. I will be constantly adding/changing stuff. Expect things to be broken, unfinished, and inconsistent. Live trading is discouraged unless you're just playing around with small amounts of currency, or really know what you're doing.

Soon I will develop a roadmap for Beta -> Stable progression, Beta testing rules/instructions, and community tools.

When the project stabilizes, I will conduct a poll for all Beta testers. If the majority feel it's ready for release, I will release the Stable version, end the Beta program, and raise the Unlock Code prices to $99.99 for Single-IP and $499.99 for Unlimited-IP. All Unlock Codes purchased during the Beta period will work with the Stable version, and forever after.

Please be patient and stay tuned!

## We Are Online.

Bot18 is "online" software, designed to be invoked without installing. Cloning the repo will only take up space.
The only pre-requisite is having [Node.js](https://nodejs.org/) >= 8.3.0 installed. 

Just open a terminal or cmd prompt and type:

```sh
$ npx bot18
```

## Welcome To ZalgoNet. NetSec Is Our Thing.

If running Bot18 for the first time, you'll be asked to log into your ZalgoNet account (browser-based signup form is at [bot18.net/register](https://bot18.net/register)) or you can create a new account through the CLI.

All communications and local storage are safely encrypted using the latest:

- TLS for all client-server transmissions with bot18.net
- [HMAC_SHA-256](http://nacl.cr.yp.to/auth.html) for all signed code from bot18.net
- [XSalsa20 + Poly1305](http://nacl.cr.yp.to/secretbox.html) for secret key encrytion
- [BCrypt](https://en.wikipedia.org/wiki/Bcrypt) for secure one-way password hashing

## Unlock Code Required.

To get the most out of Bot18, you'll need an 8-digit Unlock Code, purchasable for $49.99 (for a limited time!) at [bot18.net/beta](https://bot18.net/beta). You can pay by credit card or crypto-currency, and the code never expires and grants you automatic code updates for the entire Bot18 product lifecycle.

Or, you can try out Bot18 for free (enter "guest" as the ZalgoNet username or run with `--channel trial`), but you experience will be very sub-optimal. The "trial" engine distribution (also known as "cripple mode") is heavily DE-optimized (roughly 10x slower), does not support auto-trading strategies, and auto-quits after 15 minutes. If you like what you see, invest in an Unlock Code!

For full licensing details, see [bot18.net/licensing](https://bot18.net/licensing).

## Configuration

- Copy [this example](https://github.com/carlos8f/bot18/blob/with-gui/bot18.config-sample.js) to "bot18.config.js" in the same folder where you run your `npx bot18` command, to configure the bot. Make sure you `chmod 0600 bot18.config.js` to protect your configured API keys/passwords from exposure due to liberal filesystem permissions.
- You can also specify a specific conf file with `npx bot18 --conf <path-to-bot18.config.js>`, and/or define an account-wide conf at `~/.bot18/config.js`.
- Bonus points if you have [MongoDB](https://www.mongodb.com) installed! You can activate data streaming to Mongo by setting `c.mongo.enabled=true` in your conf file.

## Beta Features (So far)

The Beta engine build currently doesn't do anything but print something to stdio:

![screenshot](https://user-images.githubusercontent.com/106763/40774021-652490d2-6479-11e8-9cb5-160804c099a5.png)

The current ALPHA version (now being ported to the Beta platform) is an early proof-of-concept, and supports:

  - Monitoring live trade streams from [Bitfinex](https://www.bitfinex.com/) and [Coinbase Pro](https://pro.coinbase.com/) simultaneously.
  - Supports [Coinbase Pro](https://pro.coinbase.com/) (formerly known as GDAX) live trading. Tracks your account balance and reports profit/loss when you trade.
  - Press the "l" key to list available key commands. Supports executing manual trades when yellow "M" is displayed at the end of the console columns.
  - Enter "A" (capitalized) to enable auto-trading (not available in trial mode)
  - The early auto-trading strategy is based on orderbook snapshot power-imbalance, and is highly experimental. **Currently, the Beta's auto-trading strategy is not recommended for serious trading.**

## Follow Updates and Keep In Touch

- For announcements and progress updates, [follow @bot18_net on Twitter!](https://twitter.com/bot18_net)
- To support Bot18 development, [Buy a shirt, hoodie or mug!](https://shop.bot18.net/)
- For inquiries, contact us through the [bot18.net](https://bot18.net) website.

Cheers and happy trading,

[@carlos8f](https://github.com/carlos8f), May 31st 2018

[Salty](https://github.com/carlos8f/salty) ID: `3t27msBTpN2Mn2LP68ZFLUUo3AN37aoGerUFPHdus9tFJg3hw7upmnY9c7nQ9fv1EFFF9nxiU9JzFSYPRAnx8Age`
