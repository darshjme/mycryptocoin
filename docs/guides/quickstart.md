# Quickstart -- Accept Crypto Payments in 5 Minutes

Get from zero to accepting your first crypto payment in five steps.

---

## Step 1: Create Your Account

Register at [dashboard.mycrypto.co.in](https://dashboard.mycrypto.co.in) or via API:

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "email": "you@yourbusiness.com",
    "password": "SecurePass123",
    "business_name": "Your Business Name",
    "business_type": "private_limited"
  }'
```

You will receive a 6-digit OTP on WhatsApp. Verify it:

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "otp": "482916"
  }'
```

---

## Step 2: Get Your API Keys

Log in to the [dashboard](https://dashboard.mycrypto.co.in) and navigate to **Settings > API Keys**.

Generate two keys:
- **Test key** (`mcc_test_...`) for development
- **Live key** (`mcc_live_...`) for production

Or generate via API:

```bash
curl -X POST https://api.mycrypto.co.in/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "mode": "test"
  }'
```

Save the key from the response. It is shown only once.

---

## Step 3: Create Your First Payment

Use your test key to create a payment:

```bash
curl -X POST https://sandbox.api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_test_YOUR_TEST_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "currency": "USD",
    "crypto": "USDT",
    "description": "Test payment",
    "metadata": {
      "order_id": "TEST-001"
    },
    "redirect_url": "https://yoursite.com/success"
  }'
```

The response includes:

```json
{
  "id": "pay_1a2b3c4d5e6f",
  "status": "pending",
  "crypto_amount": "10.000000",
  "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "checkout_url": "https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f",
  "qr_code_url": "https://sandbox.api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/qr",
  "expires_at": "2026-03-19T11:00:00Z"
}
```

Open the `checkout_url` in your browser to see the hosted payment page. In test mode, payments auto-confirm after 30 seconds.

---

## Step 4: Handle the Webhook

When the payment confirms, MyCryptoCoin sends a webhook to your server. Set up a simple endpoint:

**Node.js (Express)**

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

// IMPORTANT: Use raw body for signature verification
app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-mcc-signature'];
    const timestamp = req.headers['x-mcc-timestamp'];
    const body = req.body.toString();

    // Verify signature
    const WEBHOOK_SECRET = process.env.MCC_WEBHOOK_SECRET;
    const payload = timestamp + '.' + body;
    const expected = 'sha256=' + crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // Process the event
    const event = JSON.parse(body);
    console.log(`Received event: ${event.type}`);

    if (event.type === 'payment.confirmed') {
      const payment = event.data;
      console.log(`Payment ${payment.id} confirmed!`);
      console.log(`Order: ${payment.metadata.order_id}`);
      console.log(`Amount: ${payment.crypto_amount} ${payment.crypto}`);

      // TODO: Fulfill the order in your system
    }

    // Always respond with 200 quickly
    res.status(200).json({ received: true });
  }
);

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

Register your webhook endpoint:

```bash
curl -X POST https://sandbox.api.mycrypto.co.in/v1/webhooks \
  -H "X-API-Key: mcc_test_YOUR_TEST_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed"]
  }'
```

Save the `secret` from the response -- you need it for signature verification.

---

## Step 5: Go Live Checklist

Before switching to production:

- [ ] **Switch API keys.** Replace `mcc_test_` with `mcc_live_` in your environment variables
- [ ] **Switch base URL.** Use `https://api.mycrypto.co.in/v1` (not sandbox)
- [ ] **Verify webhook signatures.** Ensure your endpoint verifies HMAC-SHA256 signatures
- [ ] **Handle all payment statuses.** Account for `expired`, `failed`, and `underpaid` scenarios
- [ ] **Add error handling.** Implement retries with exponential backoff for 5xx errors
- [ ] **Enable auto-withdrawal (optional).** Configure where your crypto funds are sent
- [ ] **Set up IP whitelisting (optional).** Restrict API key usage to your server IPs
- [ ] **Test with real transactions.** Make a small real payment to verify end-to-end

---

## What's Next?

- [Full Integration Guide](integration-guide.md) -- Detailed walkthrough of the complete payment flow
- [Webhook Deep Dive](webhook-guide.md) -- Signature verification, retry handling, local testing
- [SDK Examples](sdk-examples.md) -- Copy-paste code in JavaScript, Python, PHP, and cURL
- [API Reference](../api/README.md) -- Complete API documentation
