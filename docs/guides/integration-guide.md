# Full Integration Guide

This guide walks you through a production-ready MyCryptoCoin integration, from authentication to going live.

---

## Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [Creating Payments](#creating-payments)
3. [Payment Flow](#payment-flow)
4. [Handling Confirmations](#handling-confirmations)
5. [Webhook Setup and Verification](#webhook-setup-and-verification)
6. [Testing with Test Mode](#testing-with-test-mode)
7. [Going Live](#going-live)

---

## Authentication Setup

### Store your API key securely

Never hardcode API keys. Use environment variables:

```bash
# .env file (never commit this to version control)
MCC_API_KEY=mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
MCC_WEBHOOK_SECRET=whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**Node.js:**

```javascript
require('dotenv').config();
const MCC_API_KEY = process.env.MCC_API_KEY;
```

**Python:**

```python
import os
MCC_API_KEY = os.environ['MCC_API_KEY']
```

**PHP:**

```php
$apiKey = getenv('MCC_API_KEY');
```

### Set up an HTTP client

Create a reusable API client with proper headers and error handling:

**Node.js:**

```javascript
const API_BASE = 'https://api.mycrypto.co.in/v1';

async function mccRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'X-API-Key': process.env.MCC_API_KEY,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const requestId = response.headers.get('X-Request-Id');
    throw new Error(
      `MCC API Error [${requestId}]: ${data.error.code} - ${data.error.message}`
    );
  }

  return data;
}
```

**Python:**

```python
import os
import requests

API_BASE = 'https://api.mycrypto.co.in/v1'

class MCCClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': os.environ['MCC_API_KEY'],
            'Content-Type': 'application/json',
        })

    def request(self, method, path, json=None):
        response = self.session.request(method, f'{API_BASE}{path}', json=json)
        data = response.json()

        if not response.ok:
            request_id = response.headers.get('X-Request-Id')
            error = data.get('error', {})
            raise Exception(
                f"MCC API Error [{request_id}]: {error.get('code')} - {error.get('message')}"
            )

        return data

mcc = MCCClient()
```

---

## Creating Payments

### Option A: Hosted Checkout (Recommended)

The simplest integration. Create a payment via API and redirect the customer to the hosted checkout page.

```
    Your Server                 MyCryptoCoin               Customer
        |                           |                         |
        |--- POST /payments ------->|                         |
        |<-- checkout_url ----------|                         |
        |                           |                         |
        |--- Redirect customer -----|------------------------>|
        |                           |    Hosted checkout page |
        |                           |<--- Sends crypto -------|
        |                           |                         |
        |<-- Webhook: confirmed ----|                         |
        |                           |--- Redirect to your --->|
        |                           |   redirect_url          |
```

**Node.js example:**

```javascript
// In your checkout handler
app.post('/create-order', async (req, res) => {
  const { orderId, amount, customerEmail } = req.body;

  try {
    const payment = await mccRequest('POST', '/payments', {
      amount: amount,
      currency: 'USD',
      crypto: 'USDT',
      description: `Order #${orderId}`,
      metadata: {
        order_id: orderId,
        customer_email: customerEmail,
      },
      callback_url: 'https://yoursite.com/webhooks/mycryptocoin',
      redirect_url: `https://yoursite.com/order/${orderId}/success`,
      expiry_minutes: 30,
    });

    // Store payment ID with your order
    await db.orders.update(orderId, {
      mcc_payment_id: payment.id,
      status: 'awaiting_payment',
    });

    // Redirect customer to hosted checkout
    res.redirect(payment.checkout_url);
  } catch (error) {
    console.error('Payment creation failed:', error.message);
    res.status(500).render('error', { message: 'Could not create payment' });
  }
});
```

### Option B: Custom Payment UI

Build your own payment interface using the deposit address and QR code.

```javascript
app.post('/api/create-payment', async (req, res) => {
  const payment = await mccRequest('POST', '/payments', {
    amount: 49.99,
    currency: 'USD',
    crypto: req.body.crypto, // Customer chooses the crypto
    description: 'Premium Plan',
    metadata: { order_id: req.body.orderId },
    callback_url: 'https://yoursite.com/webhooks/mycryptocoin',
  });

  // Return data for your custom UI
  res.json({
    paymentId: payment.id,
    cryptoAmount: payment.crypto_amount,
    crypto: payment.crypto,
    depositAddress: payment.deposit_address,
    qrCodeUrl: payment.qr_code_url,
    expiresAt: payment.expires_at,
  });
});
```

**Frontend (React example):**

```jsx
function PaymentPage({ paymentData }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const expires = new Date(paymentData.expiresAt);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentData.expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="payment-page">
      <h2>Send {paymentData.cryptoAmount} {paymentData.crypto}</h2>
      <p>to the address below:</p>

      <code className="deposit-address">{paymentData.depositAddress}</code>

      <img src={paymentData.qrCodeUrl} alt="Payment QR Code" />

      <p className="timer">
        Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
      </p>

      <p className="warning">
        Send exactly {paymentData.cryptoAmount} {paymentData.crypto}.
        Sending a different amount may result in payment failure.
      </p>
    </div>
  );
}
```

---

## Payment Flow

Here is the complete payment lifecycle:

```
+-------------------+
|  Payment Created  |   POST /payments
|  status: pending  |
+--------+----------+
         |
         | Customer sends crypto
         v
+-------------------+
|  TX Detected      |   Webhook: payment.confirming
| status: confirming|
+--------+----------+
         |
         | Block confirmations accumulate
         v
+-------------------+
| Fully Confirmed   |   Webhook: payment.confirmed
| status: confirmed |
+--------+----------+
         |
         | Funds credited to merchant wallet
         v
+-------------------+
|  Funds Settled    |   Webhook: payment.settled
|  status: settled  |
+-------------------+


Alternative outcomes:
+-------------------+
|  No TX received   |   Webhook: payment.expired
|  status: expired  |   (after expiry_minutes)
+-------------------+

+-------------------+
|  TX failed or     |   Webhook: payment.failed
|  underpaid         |
|  status: failed   |
+-------------------+
```

### Important Timing

| Stage | Duration |
|-------|----------|
| Pending -> Confirming | Depends on customer; up to `expiry_minutes` |
| Confirming -> Confirmed | Depends on crypto (see confirmation requirements) |
| Confirmed -> Settled | Near-instant (< 5 seconds) |

---

## Handling Confirmations

### Primary: Webhooks (Recommended)

Register a webhook to receive real-time payment status updates:

```javascript
app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // 1. Verify signature (see webhook guide)
    if (!verifySignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());

    // 2. Deduplicate using delivery ID
    const deliveryId = req.headers['x-mcc-delivery-id'];
    if (await isProcessed(deliveryId)) {
      return res.status(200).json({ received: true });
    }

    // 3. Handle event
    switch (event.type) {
      case 'payment.confirming':
        await db.orders.update(
          { mcc_payment_id: event.data.id },
          { status: 'confirming', tx_hash: event.data.tx_hash }
        );
        break;

      case 'payment.confirmed':
        await db.orders.update(
          { mcc_payment_id: event.data.id },
          { status: 'paid' }
        );
        // Fulfill the order
        await fulfillOrder(event.data.metadata.order_id);
        break;

      case 'payment.failed':
        await db.orders.update(
          { mcc_payment_id: event.data.id },
          { status: 'payment_failed' }
        );
        // Notify customer
        await notifyCustomer(event.data.metadata.customer_email,
          'Your payment could not be processed.');
        break;

      case 'payment.expired':
        await db.orders.update(
          { mcc_payment_id: event.data.id },
          { status: 'expired' }
        );
        break;
    }

    // 4. Mark as processed
    await markProcessed(deliveryId);

    // 5. Respond quickly
    res.status(200).json({ received: true });
  }
);
```

### Fallback: Polling (use sparingly)

If you miss a webhook, verify the payment status directly:

```javascript
async function checkPaymentStatus(paymentId) {
  const result = await mccRequest('POST', `/payments/${paymentId}/verify`);

  if (result.verified) {
    console.log(`Payment ${paymentId} is confirmed with ${result.confirmations} confirmations`);
    return true;
  }

  console.log(`Payment ${paymentId} status: ${result.status} (${result.confirmations}/${result.required_confirmations})`);
  return false;
}
```

> **Note:** Use polling only as a fallback. Webhooks are the recommended approach for real-time updates. Polling `/payments/{id}/verify` is rate-limited to 60 requests per minute.

---

## Webhook Setup and Verification

### 1. Set up your endpoint

Your webhook endpoint must:
- Accept POST requests
- Return a 2xx status code within 30 seconds
- Verify the HMAC-SHA256 signature
- Handle duplicate deliveries idempotently

### 2. Register the webhook

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": [
      "payment.confirming",
      "payment.confirmed",
      "payment.failed",
      "payment.expired",
      "withdrawal.completed"
    ]
  }'
```

### 3. Store the webhook secret

The response contains a `secret` field. Store it in your environment variables:

```bash
MCC_WEBHOOK_SECRET=whsec_a1b2c3d4e5f6g7h8i9j0...
```

### 4. Verify signatures

See the [Webhook Deep Dive](webhook-guide.md) for full verification code in all languages.

### 5. Test the webhook

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks/whk_m1n2o3p4q5/test \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

---

## Testing with Test Mode

### Test mode differences

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Base URL | `sandbox.api.mycrypto.co.in/v1` | `api.mycrypto.co.in/v1` |
| API Key Prefix | `mcc_test_` | `mcc_live_` |
| Real transactions | No | Yes |
| Auto-confirmation | 30 seconds | Depends on blockchain |
| Pre-funded wallets | Yes (1 BTC, 10 ETH, 10000 USDT) | No |
| Webhooks | Sent normally | Sent normally |

### Test payment flow

1. Create a payment with your test API key
2. The payment auto-confirms after 30 seconds (no real crypto needed)
3. Your webhook endpoint receives the same events as production
4. Use this to test your order fulfillment logic end-to-end

### Test card-like values

In test mode, you can append a suffix to the `description` field to simulate outcomes:

| Description suffix | Result |
|-------------------|--------|
| `_succeed` | Payment confirms after 30 seconds |
| `_fail` | Payment fails after 15 seconds |
| `_expire` | Payment expires after 60 seconds |
| `_underpaid` | Payment fails with underpaid status |

Example:

```bash
curl -X POST https://sandbox.api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_test_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "currency": "USD",
    "crypto": "USDT",
    "description": "Test order _fail"
  }'
```

---

## Going Live

### Pre-launch checklist

**Code:**
- [ ] API key stored in environment variable, not hardcoded
- [ ] Using `mcc_live_` key and production base URL
- [ ] Webhook signature verification is implemented and tested
- [ ] All payment statuses are handled (confirmed, failed, expired)
- [ ] Idempotent webhook handler (deduplicates by `X-MCC-Delivery-Id`)
- [ ] Error handling with exponential backoff for retries
- [ ] Logging includes `X-Request-Id` for support troubleshooting

**Security:**
- [ ] HTTPS enforced on your webhook endpoint
- [ ] API key has minimum necessary permissions
- [ ] IP whitelisting configured (optional but recommended)
- [ ] Webhook secret stored securely

**Operations:**
- [ ] Monitoring/alerting set up for webhook failures
- [ ] Fallback polling implemented for missed webhooks
- [ ] Test payment completed successfully in live mode
- [ ] Auto-withdrawal configured (if desired)
- [ ] Support contact saved: developers@mycrypto.co.in

### Switch to production

1. Replace your test API key with a live key in your environment:
   ```bash
   MCC_API_KEY=mcc_live_YOUR_LIVE_KEY
   ```

2. Update the base URL:
   ```bash
   MCC_API_BASE=https://api.mycrypto.co.in/v1
   ```

3. Register a production webhook (test and production webhooks are separate):
   ```bash
   curl -X POST https://api.mycrypto.co.in/v1/webhooks \
     -H "X-API-Key: mcc_live_YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://yoursite.com/webhooks/mycryptocoin",
       "events": ["payment.confirmed", "payment.failed", "payment.expired"]
     }'
   ```

4. Make a small real payment to verify everything works end-to-end.

5. You are live. Start accepting crypto payments.
