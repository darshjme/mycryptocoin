# WordPress / WooCommerce Integration

Accept cryptocurrency payments on your WooCommerce store using the MyCryptoCoin plugin. This guide walks you through installation, configuration, testing, and going live.

---

## Prerequisites

- WordPress 5.8 or later
- WooCommerce 6.0 or later
- PHP 7.4 or later
- SSL certificate (HTTPS) on your site
- A MyCryptoCoin merchant account ([Sign up here](https://dashboard.mycrypto.co.in))

---

## Step 1: Install the Plugin

### Option A: WordPress Plugin Directory

1. Log in to your WordPress admin panel
2. Go to **Plugins > Add New**
3. Search for **"MyCryptoCoin Payments"**
4. Click **Install Now**, then **Activate**

### Option B: Manual Upload

1. Download the latest plugin zip from [dashboard.mycrypto.co.in/integrations/wordpress](https://dashboard.mycrypto.co.in/integrations/wordpress)
2. Go to **Plugins > Add New > Upload Plugin**
3. Choose the zip file and click **Install Now**
4. Click **Activate**

### Option C: FTP / File Manager

1. Download and unzip the plugin
2. Upload the `mycryptocoin-payments` folder to `/wp-content/plugins/`
3. Go to **Plugins** in WordPress admin and click **Activate** next to MyCryptoCoin Payments

---

## Step 2: Configure Your API Key

1. Go to **WooCommerce > Settings > Payments**
2. Find **MyCryptoCoin** in the payment methods list and click **Set up** (or **Manage**)
3. Fill in the settings:

| Setting | Value |
|---------|-------|
| **Enable/Disable** | Check "Enable MyCryptoCoin Payments" |
| **Title** | "Pay with Crypto" (shown to customers at checkout) |
| **Description** | "Pay with Bitcoin, Ethereum, USDT, and more" |
| **API Key** | Paste your `mcc_live_` API key (or `mcc_test_` for testing) |
| **Webhook Secret** | Paste the webhook secret from your MyCryptoCoin dashboard |
| **Mode** | Select "Test" for testing, "Live" for production |

4. Click **Save changes**

### Getting Your API Key

1. Log in to [dashboard.mycrypto.co.in](https://dashboard.mycrypto.co.in)
2. Go to **Settings > API Keys**
3. Click **Generate New Key**
4. Name it "WordPress / WooCommerce"
5. Select mode: **Test** (for setup) or **Live** (for production)
6. Select permissions: `payments:read`, `payments:write`
7. Copy the key and paste it into the plugin settings

---

## Step 3: Select Supported Cryptocurrencies

1. In the MyCryptoCoin plugin settings, scroll to **Accepted Cryptocurrencies**
2. Check the cryptocurrencies you want to accept:

   - [ ] BTC (Bitcoin)
   - [ ] ETH (Ethereum)
   - [ ] USDT (Tether)
   - [ ] USDC (USD Coin)
   - [ ] BNB (BNB)
   - [ ] SOL (Solana)
   - [ ] MATIC (Polygon)
   - [ ] LTC (Litecoin)
   - [ ] DOGE (Dogecoin)
   - [ ] XRP (XRP)

3. Configure additional options:

| Setting | Description | Recommended |
|---------|-------------|-------------|
| **Default Cryptocurrency** | Pre-selected crypto at checkout | USDT |
| **Payment Expiry** | Minutes before payment expires | 30 |
| **Order Status on Confirming** | WooCommerce status when TX detected | On Hold |
| **Order Status on Confirmed** | WooCommerce status when confirmed | Processing |
| **Auto-complete Digital Orders** | Auto-complete for downloadable products | Yes |

4. Click **Save changes**

---

## Step 4: Configure the Webhook

The plugin automatically creates a webhook endpoint at:

```
https://yoursite.com/?wc-api=mycryptocoin_webhook
```

You need to register this URL in your MyCryptoCoin dashboard:

### Automatic Registration (Recommended)

1. In the plugin settings, click the **Register Webhook** button
2. The plugin will automatically register the webhook URL with MyCryptoCoin
3. You will see a success message with the webhook ID

### Manual Registration

If automatic registration fails:

1. Log in to [dashboard.mycrypto.co.in](https://dashboard.mycrypto.co.in)
2. Go to **Settings > Webhooks**
3. Click **Add Webhook**
4. Enter:
   - **URL:** `https://yoursite.com/?wc-api=mycryptocoin_webhook`
   - **Events:** `payment.confirming`, `payment.confirmed`, `payment.completed`, `payment.failed`, `payment.expired`
5. Copy the webhook secret and paste it into the plugin settings

---

## Step 5: Test a Payment

1. Ensure the plugin is set to **Test** mode with a `mcc_test_` API key
2. Go to your store frontend
3. Add a product to cart and proceed to checkout
4. Select **Pay with Crypto** as the payment method
5. Choose a cryptocurrency (e.g., USDT)
6. Click **Place Order**
7. You will be redirected to the MyCryptoCoin hosted checkout page
8. In test mode, the payment auto-confirms after 30 seconds
9. You will be redirected back to the order confirmation page
10. Check the order in **WooCommerce > Orders** -- it should show status "Processing"

### Verify the webhook works

1. Go to **WooCommerce > Orders**
2. Open the test order
3. Check the **Order Notes** section -- you should see:
   - "MyCryptoCoin: Payment created (pay_...)"
   - "MyCryptoCoin: Payment confirming - TX detected"
   - "MyCryptoCoin: Payment confirmed"

If order notes are not updating, check the webhook configuration.

---

## Step 6: Go Live

1. Generate a **live** API key (`mcc_live_`) from the MyCryptoCoin dashboard
2. In the plugin settings:
   - Change **Mode** to **Live**
   - Replace the test API key with the live key
   - The webhook secret should remain the same (or register a new production webhook)
3. Click **Save changes**
4. Make a small real purchase to verify everything works

---

## Customer Checkout Experience

When a customer selects "Pay with Crypto" at checkout:

1. **Crypto selection:** Customer chooses their preferred cryptocurrency
2. **Redirect:** Customer is redirected to the MyCryptoCoin hosted checkout page
3. **Payment page:** Shows the exact amount, deposit address, QR code, and countdown timer
4. **Waiting:** Customer sends crypto from their wallet
5. **Confirmation:** Page updates when the transaction is detected and confirmed
6. **Redirect back:** Customer is redirected to the WooCommerce thank-you page

---

## Plugin Settings Reference

| Setting | Description | Default |
|---------|-------------|---------|
| Enable/Disable | Toggle the payment method | Disabled |
| Title | Payment method title at checkout | "Pay with Crypto" |
| Description | Payment method description | "Pay with Bitcoin, Ethereum, USDT, and more" |
| API Key | Your MyCryptoCoin API key | -- |
| Webhook Secret | Secret for verifying webhook signatures | -- |
| Mode | Test or Live | Test |
| Accepted Cryptos | Which cryptocurrencies to offer | All |
| Default Crypto | Pre-selected cryptocurrency | USDT |
| Payment Expiry | Minutes before expiry | 30 |
| Order Status (Confirming) | Order status when TX is detected | On Hold |
| Order Status (Confirmed) | Order status when payment confirms | Processing |
| Auto-complete Digital | Auto-complete downloadable orders | No |
| Debug Logging | Enable detailed logs | No |

---

## Troubleshooting

### Payment created but order status never updates

**Cause:** Webhook is not reaching your site.

**Fix:**
1. Check that the webhook URL is correct in the MyCryptoCoin dashboard
2. Verify your site is accessible over HTTPS from the internet
3. Check if a security plugin or firewall is blocking the webhook POST request
4. Enable **Debug Logging** in the plugin settings
5. Check logs at `wp-content/uploads/wc-logs/mycryptocoin-*.log`

### "Invalid API Key" error at checkout

**Cause:** The API key is wrong or the mode does not match.

**Fix:**
1. Confirm you are using the correct key for the selected mode (test key for Test, live key for Live)
2. Regenerate the API key if necessary
3. Ensure no extra spaces were copied with the key

### Customer redirected but payment page shows error

**Cause:** API communication failure.

**Fix:**
1. Check if your server can reach `api.mycrypto.co.in` (some hosting providers block outgoing requests)
2. Verify PHP cURL extension is enabled
3. Check the plugin debug log for the specific error

### Orders stuck on "Pending Payment"

**Cause:** The customer abandoned the payment, or the webhook failed.

**Fix:**
1. Payments in "Pending Payment" that have expired are automatically cancelled by WooCommerce
2. Check the MyCryptoCoin dashboard for the payment status
3. If the payment was confirmed but the order was not updated, manually update it and check webhook configuration

### Plugin conflicts

If you experience issues after installing:
1. Temporarily disable other plugins to identify conflicts
2. Switch to a default WordPress theme (e.g., Twenty Twenty-Four) to rule out theme issues
3. Contact support with the debug log

---

## Hooks and Filters for Developers

The plugin provides hooks for customization:

```php
// Modify the crypto list shown at checkout
add_filter('mycryptocoin_available_cryptos', function($cryptos) {
    // Only show BTC and USDT
    return ['BTC', 'USDT'];
});

// Add custom metadata to the payment
add_filter('mycryptocoin_payment_metadata', function($metadata, $order) {
    $metadata['customer_name'] = $order->get_billing_first_name();
    $metadata['custom_field'] = get_post_meta($order->get_id(), 'my_custom_field', true);
    return $metadata;
}, 10, 2);

// Run code after a payment is confirmed
add_action('mycryptocoin_payment_confirmed', function($order, $payment_data) {
    // Send custom notification, update inventory, etc.
    error_log("Payment confirmed for order #" . $order->get_id());
}, 10, 2);

// Customize the payment expiry per order
add_filter('mycryptocoin_payment_expiry', function($minutes, $order) {
    // Give high-value orders more time
    if ($order->get_total() > 1000) {
        return 60; // 60 minutes
    }
    return $minutes;
}, 10, 2);
```

---

## Updating the Plugin

The plugin supports standard WordPress auto-updates. When a new version is available:

1. Go to **Plugins > Installed Plugins**
2. Click **Update Now** next to MyCryptoCoin Payments

Or enable automatic updates by clicking **Enable auto-updates**.

---

## Uninstalling

1. Go to **Plugins > Installed Plugins**
2. Click **Deactivate** next to MyCryptoCoin Payments
3. Click **Delete**

> **Note:** Uninstalling the plugin does not affect existing orders or payments. Your MyCryptoCoin account and funds remain intact.

---

## Support

- **Plugin Documentation:** https://developers.mycrypto.co.in/wordpress
- **Email:** developers@mycrypto.co.in
- **WhatsApp:** +91-9876543210
- **WordPress Support Forum:** https://wordpress.org/support/plugin/mycryptocoin-payments/
