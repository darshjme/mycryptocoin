=== MyCryptoCoin Gateway ===
Contributors: mycryptocoin
Tags: cryptocurrency, bitcoin, ethereum, woocommerce, payment gateway, crypto payments, usdt, solana, bnb
Requires at least: 6.0
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.0.0
WC requires at least: 7.0
WC tested up to: 8.5
License: GPL-2.0+
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accept Bitcoin, Ethereum, and 10+ cryptocurrencies on your WooCommerce store. Powered by MyCryptoCoin — the Stripe of crypto payments. Just 0.5% per transaction.

== Description ==

**MyCryptoCoin Gateway** is the easiest way to accept cryptocurrency payments in your WooCommerce store. Set up in under 5 minutes and start accepting Bitcoin, Ethereum, USDT, Solana, and 10+ other cryptos.

= Why MyCryptoCoin? =

* **Lowest fees** — Just 0.5% per transaction. No monthly fees, no setup costs.
* **Instant setup** — Connect your MyCryptoCoin account, enable your preferred cryptos, and go live.
* **13+ cryptocurrencies** — Accept BTC, ETH, USDT, USDC, BNB, SOL, XRP, ADA, DOGE, MATIC, LTC, TRX, and AVAX.
* **Auto-conversion** — Optionally convert crypto to fiat instantly. No volatility risk.
* **Hosted payment page** — Customers are redirected to a secure, branded payment page on mycrypto.co.in.
* **Real-time notifications** — Webhook-based order updates. Orders are confirmed automatically.
* **Refunds** — Process crypto refunds directly from WooCommerce.
* **WooCommerce Blocks** — Full support for the block-based checkout.
* **HPOS compatible** — Works with WooCommerce High-Performance Order Storage.
* **Test mode** — Simulate payments without real crypto. Perfect for development and staging.

= How It Works =

1. Customer selects "Pay with Crypto" at checkout and picks their preferred cryptocurrency.
2. They are redirected to a secure payment page with a QR code and wallet address.
3. After sending the payment, the blockchain transaction is verified automatically.
4. Once confirmed, the WooCommerce order is updated and the customer is notified.

= Supported Cryptocurrencies =

* Bitcoin (BTC)
* Ethereum (ETH)
* Tether (USDT)
* USD Coin (USDC)
* BNB (BNB)
* Solana (SOL)
* XRP (XRP)
* Cardano (ADA)
* Dogecoin (DOGE)
* Polygon (MATIC)
* Litecoin (LTC)
* TRON (TRX)
* Avalanche (AVAX)

== Installation ==

= Automatic Installation =

1. Log in to your WordPress admin panel.
2. Go to **Plugins > Add New**.
3. Search for "MyCryptoCoin Gateway".
4. Click **Install Now** and then **Activate**.

= Manual Installation =

1. Download the plugin ZIP file.
2. Go to **Plugins > Add New > Upload Plugin**.
3. Upload the ZIP and click **Install Now**.
4. Activate the plugin.

= Configuration =

1. Go to **WooCommerce > Settings > Payments**.
2. Click **MyCryptoCoin** to configure.
3. Create a free account at [mycrypto.co.in](https://mycrypto.co.in) if you don't have one.
4. Copy your API key from the MyCryptoCoin dashboard.
5. Paste it in the **API Key** field.
6. Copy the **Webhook URL** shown on the settings page and add it to your MyCryptoCoin dashboard.
7. Copy the **Webhook Secret** from MyCryptoCoin and paste it in the settings.
8. Select which cryptocurrencies you want to accept.
9. Enable the gateway and save.

== Frequently Asked Questions ==

= Do I need a MyCryptoCoin account? =

Yes. Create a free account at [mycrypto.co.in](https://mycrypto.co.in). No credit card required.

= What are the fees? =

MyCryptoCoin charges just 0.5% per transaction. There are no monthly fees, no setup fees, and no hidden costs.

= Can I test payments without real crypto? =

Yes. Enable **Test Mode** in the gateway settings and use your test API key. No real crypto will be processed.

= How long do payments take to confirm? =

Confirmation time depends on the cryptocurrency and network congestion. Bitcoin typically takes 10-30 minutes, while Ethereum and other chains are usually faster.

= Can I offer refunds? =

Yes. You can initiate crypto refunds directly from the WooCommerce order page, just like any other payment method.

= Is it compatible with WooCommerce Blocks? =

Yes. MyCryptoCoin Gateway fully supports the new block-based checkout introduced in WooCommerce 8.3+.

= Does it work with HPOS (High-Performance Order Storage)? =

Yes. The plugin is fully compatible with WooCommerce HPOS.

= Which currencies can I price my products in? =

You can price products in any of 30+ fiat currencies (USD, EUR, GBP, INR, and more). MyCryptoCoin handles the fiat-to-crypto conversion in real time.

= Where can I get support? =

Visit [mycrypto.co.in/support](https://mycrypto.co.in/support) or email support@mycrypto.co.in.

== Screenshots ==

1. Checkout page — Customer selects their preferred cryptocurrency.
2. Payment page — QR code and wallet address for sending crypto.
3. Admin settings — Configure API keys, supported cryptos, and more.
4. Order page — Payment confirmation details with transaction hash.
5. Test mode banner — Clear indicator when test mode is active.

== Changelog ==

= 1.0.0 - 2024-12-01 =
* Initial release.
* Accept 13+ cryptocurrencies via MyCryptoCoin.
* Hosted payment page with QR code and countdown timer.
* Webhook-based order status updates.
* Refund support.
* WooCommerce Blocks compatibility.
* HPOS compatibility.
* Test mode for development and staging.
* Debug logging for troubleshooting.

== Upgrade Notice ==

= 1.0.0 =
Initial release. Install and configure to start accepting crypto payments.
