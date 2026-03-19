# Shopify Integration Guide

Accept cryptocurrency payments in your Shopify store using MyCryptoCoin.

## Prerequisites

- A MyCryptoCoin merchant account ([sign up](https://mycrypto.co.in))
- A Shopify store with admin access
- Your MyCryptoCoin API key (`mcc_live_...`)

## Overview

MyCryptoCoin integrates with Shopify using the **Custom Payment Gateway** API. When a customer checks out, Shopify redirects them to our hosted checkout page. After payment, the customer is redirected back to Shopify with the order marked as paid.

## Step 1: Create a Custom Payment App

1. Go to **Shopify Admin** > **Settings** > **Payments**
2. Scroll to **Manual payment methods** and click **Add manual payment method**
3. Or, for a seamless integration, create a Shopify app:
   - Go to [Shopify Partners](https://partners.shopify.com)
   - Create a new app
   - Enable the **Payments** extension

## Step 2: Configure Webhook URLs

In your MyCryptoCoin dashboard (**Settings** > **Webhooks**), add:

| Event              | URL                                                    |
|--------------------|--------------------------------------------------------|
| `payment.completed`| `https://your-store.myshopify.com/admin/api/webhooks`  |
| `payment.expired`  | `https://your-store.myshopify.com/admin/api/webhooks`  |

## Step 3: Create the Payment Flow

### 3a. Redirect to MyCryptoCoin Checkout

When a customer chooses crypto payment at checkout, redirect them:

```javascript
// In your Shopify payment extension
const response = await fetch('https://mycrypto.co.in/api/v1/checkout/session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MYCRYPTOCOIN_API_KEY}`,
  },
  body: JSON.stringify({
    amount: order.total_price,
    currency: order.currency,
    displayMode: 'page',
    externalId: order.id.toString(),
    customerEmail: order.customer?.email,
    successUrl: `https://your-store.myshopify.com/orders/${order.id}/thank-you`,
    cancelUrl: `https://your-store.myshopify.com/cart`,
    metadata: {
      shopify_order_id: order.id,
      shopify_order_number: order.order_number,
    },
  }),
});

const { data } = await response.json();
// Redirect customer to: data.checkoutUrl
```

### 3b. Handle the Webhook

When payment completes, MyCryptoCoin sends a webhook to your server:

```javascript
// Webhook handler
app.post('/webhooks/mycryptocoin', (req, res) => {
  // Verify HMAC signature
  const signature = req.headers['x-mcc-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET);

  if (!isValid) return res.status(401).send('Invalid signature');

  const { event, paymentId, metadata } = req.body;

  if (event === 'payment.completed') {
    // Mark Shopify order as paid
    const orderId = metadata.shopify_order_id;
    await shopifyAdmin.order.update(orderId, {
      financial_status: 'paid',
      note: `Paid via crypto (MyCryptoCoin payment: ${paymentId})`,
    });
  }

  res.status(200).send('OK');
});
```

## Step 4: Order Status Sync

To keep Shopify orders in sync with MyCryptoCoin payments:

1. **Payment Completed** -> Mark order as `paid`
2. **Payment Expired** -> Keep order as `pending` (customer can retry)
3. **Refund Completed** -> Mark order as `refunded` (partial or full)

## Step 5: Test the Integration

1. Use a test API key (`mcc_test_...`) which connects to testnets
2. Create a test order in Shopify
3. Complete payment using testnet crypto
4. Verify the order status updates correctly

## Supported Features

| Feature                  | Status |
|--------------------------|--------|
| Full checkout redirect   | Yes    |
| Popup checkout (iframe)  | Yes    |
| 30+ cryptocurrencies     | Yes    |
| Lightning Network (BTC)  | Yes    |
| Auto-convert to USDT     | Yes    |
| Discount codes           | Yes    |
| Refunds                  | Yes    |
| Multi-currency pricing   | Yes    |
| Testnet mode             | Yes    |
| Webhooks                 | Yes    |

## Troubleshooting

- **Webhook not received**: Verify the URL is accessible and HMAC signature verification is correct
- **Order not updating**: Check that `metadata.shopify_order_id` is included in the checkout session
- **Test payments not working**: Ensure you're using `mcc_test_` prefixed API keys

## Support

- Email: support@mycrypto.co.in
- Docs: https://mycrypto.co.in/docs
- Discord: https://discord.gg/mycryptocoin
