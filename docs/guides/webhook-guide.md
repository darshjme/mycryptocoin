# Webhook Deep Dive

A comprehensive guide to receiving, verifying, and processing MyCryptoCoin webhook events.

---

## How Webhooks Work

When events occur (payment confirmed, withdrawal completed, etc.), MyCryptoCoin sends an HTTP POST request to your registered URL with a JSON payload describing the event.

```
MyCryptoCoin                     Your Server
    |                                |
    |--- POST /your-webhook-url ---->|
    |    Headers:                     |
    |      X-MCC-Signature           |
    |      X-MCC-Event               |
    |      X-MCC-Delivery-Id         |
    |      X-MCC-Timestamp           |
    |    Body: { event JSON }        |
    |                                |
    |<--- 200 OK -------------------|
    |                                |
```

Your endpoint must:
- Accept HTTPS POST requests
- Respond with a 2xx status code within 30 seconds
- Verify the HMAC-SHA256 signature
- Process events idempotently

---

## Setting Up Your Endpoint

### 1. Create a publicly accessible HTTPS endpoint

Your webhook URL must be:
- HTTPS (HTTP is rejected)
- Publicly accessible from the internet
- Capable of receiving POST requests

### 2. Register the endpoint

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed", "payment.expired", "withdrawal.completed"],
    "description": "Production webhook"
  }'
```

### 3. Store the signing secret

The response includes a `secret` field. This is your HMAC-SHA256 signing secret. Store it securely:

```bash
# .env
MCC_WEBHOOK_SECRET=whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

The secret is shown only once at creation time. If you lose it, delete the webhook and create a new one.

---

## Signature Verification

Every webhook request includes these headers:

| Header | Description |
|--------|-------------|
| `X-MCC-Signature` | `sha256=<hex_hmac>` |
| `X-MCC-Timestamp` | Unix timestamp when the event was sent |

The signature is computed as:

```
HMAC-SHA256(webhook_secret, timestamp + "." + raw_request_body)
```

You must verify this signature to ensure:
1. The request came from MyCryptoCoin (not a malicious third party)
2. The payload was not modified in transit
3. The request is recent (not a replay attack)

### Node.js (Express)

```javascript
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.MCC_WEBHOOK_SECRET;

// IMPORTANT: You must use raw body, not parsed JSON
// Configure Express to preserve the raw body:
app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-mcc-signature'];
    const timestamp = req.headers['x-mcc-timestamp'];
    const rawBody = req.body.toString();

    // Check required headers exist
    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing signature headers' });
    }

    // Prevent replay attacks: reject requests older than 5 minutes
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return res.status(401).json({ error: 'Request timestamp too old' });
    }

    // Compute expected signature
    const payload = timestamp + '.' + rawBody;
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Signature verified -- process the event
    const event = JSON.parse(rawBody);
    handleEvent(event);

    res.status(200).json({ received: true });
  }
);
```

### Python (Flask)

```python
import hmac
import hashlib
import time
import json
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = os.environ['MCC_WEBHOOK_SECRET']

@app.route('/webhooks/mycryptocoin', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-MCC-Signature', '')
    timestamp = request.headers.get('X-MCC-Timestamp', '')
    raw_body = request.get_data(as_text=True)

    # Check required headers
    if not signature or not timestamp:
        return jsonify({'error': 'Missing signature headers'}), 401

    # Prevent replay attacks
    current_time = int(time.time())
    if abs(current_time - int(timestamp)) > 300:
        return jsonify({'error': 'Request timestamp too old'}), 401

    # Compute expected signature
    payload = f"{timestamp}.{raw_body}"
    expected_signature = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Timing-safe comparison
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({'error': 'Invalid signature'}), 401

    # Signature verified
    event = json.loads(raw_body)
    handle_event(event)

    return jsonify({'received': True}), 200
```

### PHP

```php
<?php
$webhookSecret = getenv('MCC_WEBHOOK_SECRET');
$rawBody = file_get_contents('php://input');

// Get headers (normalize for different server environments)
$headers = [];
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $header = str_replace('_', '-', strtolower(substr($key, 5)));
        $headers[$header] = $value;
    }
}

$signature = $headers['x-mcc-signature'] ?? '';
$timestamp = $headers['x-mcc-timestamp'] ?? '';

// Check required headers
if (empty($signature) || empty($timestamp)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing signature headers']);
    exit;
}

// Prevent replay attacks
if (abs(time() - intval($timestamp)) > 300) {
    http_response_code(401);
    echo json_encode(['error' => 'Request timestamp too old']);
    exit;
}

// Compute expected signature
$payload = $timestamp . '.' . $rawBody;
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);

// Timing-safe comparison
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Signature verified
$event = json_decode($rawBody, true);
handleEvent($event);

http_response_code(200);
echo json_encode(['received' => true]);
```

### Go

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "math"
    "net/http"
    "os"
    "strconv"
    "time"
)

var webhookSecret = os.Getenv("MCC_WEBHOOK_SECRET")

func verifySignature(r *http.Request, body []byte) bool {
    signature := r.Header.Get("X-MCC-Signature")
    timestamp := r.Header.Get("X-MCC-Timestamp")

    if signature == "" || timestamp == "" {
        return false
    }

    // Prevent replay attacks
    ts, err := strconv.ParseInt(timestamp, 10, 64)
    if err != nil {
        return false
    }
    if math.Abs(float64(time.Now().Unix()-ts)) > 300 {
        return false
    }

    // Compute expected signature
    payload := timestamp + "." + string(body)
    mac := hmac.New(sha256.New, []byte(webhookSecret))
    mac.Write([]byte(payload))
    expectedSignature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

    return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

    if !verifySignature(r, body) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    var event map[string]interface{}
    json.Unmarshal(body, &event)
    fmt.Printf("Event received: %s\n", event["type"])

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]bool{"received": true})
}

func main() {
    http.HandleFunc("/webhooks/mycryptocoin", webhookHandler)
    http.ListenAndServe(":3000", nil)
}
```

---

## Handling Events

### Event Payload Structure

```json
{
  "id": "evt_x1y2z3a4b5",
  "type": "payment.confirmed",
  "created_at": "2026-03-19T10:45:22Z",
  "data": {
    // Full resource object (Payment, Withdrawal, etc.)
  }
}
```

### Event Types and Actions

| Event | Recommended Action |
|-------|-------------------|
| `payment.created` | Optional: update order status to "awaiting payment" |
| `payment.confirming` | Update order to "payment processing" or "on hold" |
| `payment.confirmed` | **Fulfill the order** (this is the key event) |
| `payment.settled` | Update internal records; funds are in your wallet |
| `payment.failed` | Cancel or flag the order, notify customer |
| `payment.expired` | Cancel the order, release reserved inventory |
| `withdrawal.processing` | Log the withdrawal |
| `withdrawal.completed` | Update withdrawal records |
| `withdrawal.failed` | Alert your operations team |

### Example: Complete Event Handler

```javascript
async function handleEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'payment.confirmed': {
      const orderId = data.metadata?.order_id;
      if (!orderId) break;

      // Check if already fulfilled (idempotency)
      const order = await db.orders.findOne({ id: orderId });
      if (order.status === 'fulfilled') {
        console.log(`Order ${orderId} already fulfilled, skipping`);
        break;
      }

      // Update order
      await db.orders.update(orderId, {
        status: 'paid',
        payment_id: data.id,
        payment_crypto: data.crypto,
        payment_amount: data.crypto_amount,
        payment_tx_hash: data.tx_hash,
        paid_at: data.confirmed_at,
      });

      // Fulfill
      await fulfillOrder(orderId);

      // Notify customer
      await sendEmail(data.metadata.customer_email, 'orderConfirmation', {
        orderId,
        amount: `${data.crypto_amount} ${data.crypto}`,
      });

      console.log(`Order ${orderId} fulfilled for payment ${data.id}`);
      break;
    }

    case 'payment.failed': {
      const orderId = data.metadata?.order_id;
      if (!orderId) break;

      await db.orders.update(orderId, {
        status: 'payment_failed',
        failure_reason: 'Payment not received or underpaid',
      });

      await sendEmail(data.metadata.customer_email, 'paymentFailed', {
        orderId,
      });
      break;
    }

    case 'payment.expired': {
      const orderId = data.metadata?.order_id;
      if (!orderId) break;

      await db.orders.update(orderId, { status: 'expired' });
      await releaseInventory(orderId);
      break;
    }

    case 'withdrawal.completed': {
      console.log(`Withdrawal ${data.id} completed: ${data.net_amount} ${data.crypto}`);
      console.log(`TX Hash: ${data.tx_hash}`);
      break;
    }

    case 'withdrawal.failed': {
      console.error(`Withdrawal ${data.id} FAILED: ${data.amount} ${data.crypto}`);
      await alertOpsTeam(`Withdrawal failed: ${data.id}`);
      break;
    }

    default:
      console.log(`Unhandled event: ${type}`);
  }
}
```

---

## Retry Behavior

If your endpoint does not respond with a 2xx status code within 30 seconds, MyCryptoCoin retries:

| Attempt | Timing |
|---------|--------|
| Initial delivery | Immediately when event occurs |
| 1st retry | 1 minute later |
| 2nd retry | 10 minutes later |
| 3rd retry | 1 hour later |

After 3 failed retries, the delivery is marked as failed.

**What counts as a failure:**
- HTTP response status 3xx, 4xx (except 401), or 5xx
- Connection timeout (30 seconds)
- DNS resolution failure
- TLS/SSL error
- Connection refused

**What counts as success:**
- Any 2xx response (200, 201, 202, 204, etc.)

**Note:** A 401 response permanently marks the delivery as failed (no retries), since it indicates a signature verification problem that won't resolve on retry.

---

## Idempotency

The same event may be delivered more than once. Your handler must produce the same result regardless of how many times it processes the same event.

### Using X-MCC-Delivery-Id

Every webhook delivery has a unique `X-MCC-Delivery-Id` header. Store processed delivery IDs and skip duplicates:

```javascript
// Using Redis for production
const redis = require('redis');
const client = redis.createClient();

async function isProcessed(deliveryId) {
  const exists = await client.get(`webhook:${deliveryId}`);
  return exists !== null;
}

async function markProcessed(deliveryId) {
  // Expire after 7 days to prevent unbounded storage
  await client.set(`webhook:${deliveryId}`, '1', { EX: 604800 });
}

app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // Verify signature...

    const deliveryId = req.headers['x-mcc-delivery-id'];

    if (await isProcessed(deliveryId)) {
      return res.status(200).json({ received: true });
    }

    const event = JSON.parse(req.body.toString());
    await handleEvent(event);
    await markProcessed(deliveryId);

    res.status(200).json({ received: true });
  }
);
```

### Using Database State

Alternatively, make your business logic idempotent by checking the current state:

```javascript
case 'payment.confirmed': {
  const order = await db.orders.findOne({ id: orderId });

  // Skip if already in a terminal state
  if (['paid', 'fulfilled', 'shipped'].includes(order.status)) {
    break;
  }

  // Process the payment
  await db.orders.update(orderId, { status: 'paid' });
  await fulfillOrder(orderId);
  break;
}
```

---

## Testing Webhooks Locally

During development, your local server is not accessible from the internet. Use ngrok to create a public tunnel.

### Using ngrok

1. Install ngrok: https://ngrok.com/download

2. Start your local webhook server:
   ```bash
   node webhook-server.js
   # Listening on port 3000
   ```

3. Start ngrok:
   ```bash
   ngrok http 3000
   ```

4. ngrok gives you a public URL:
   ```
   Forwarding  https://a1b2c3d4.ngrok.io -> http://localhost:3000
   ```

5. Register the ngrok URL as your webhook endpoint:
   ```bash
   curl -X POST https://sandbox.api.mycrypto.co.in/v1/webhooks \
     -H "X-API-Key: mcc_test_YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://a1b2c3d4.ngrok.io/webhooks/mycryptocoin",
       "events": ["*"]
     }'
   ```

6. Create a test payment. In sandbox mode, it auto-confirms after 30 seconds, triggering webhooks to your local server.

### Using the Test Endpoint

Send a test event without creating a real payment:

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks/whk_m1n2o3p4q5/test \
  -H "X-API-Key: mcc_test_YOUR_KEY"
```

This sends a simulated `payment.confirmed` event to your endpoint. Check the response to confirm it was delivered successfully.

### Manual Testing with cURL

Simulate a webhook delivery locally (useful for testing signature verification):

```bash
# Set your variables
WEBHOOK_SECRET="whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
TIMESTAMP=$(date +%s)
BODY='{"id":"evt_test123","type":"payment.confirmed","created_at":"2026-03-19T10:45:22Z","data":{"id":"pay_test123","status":"confirmed","crypto_amount":"99.990000","crypto":"USDT","metadata":{"order_id":"TEST-001"}}}'

# Compute signature
PAYLOAD="${TIMESTAMP}.${BODY}"
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')"

# Send the request
curl -X POST http://localhost:3000/webhooks/mycryptocoin \
  -H "Content-Type: application/json" \
  -H "X-MCC-Signature: $SIGNATURE" \
  -H "X-MCC-Timestamp: $TIMESTAMP" \
  -H "X-MCC-Event: payment.confirmed" \
  -H "X-MCC-Delivery-Id: test-delivery-$(date +%s)" \
  -d "$BODY"
```

---

## Best Practices

### 1. Respond immediately, process asynchronously

Return a 200 response right away, then process the event in a background job:

```javascript
app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!verifySignature(req)) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString());

    // Queue for async processing
    await jobQueue.add('process-webhook', {
      event,
      deliveryId: req.headers['x-mcc-delivery-id'],
    });

    // Respond immediately
    res.status(200).json({ received: true });
  }
);
```

### 2. Log everything

Log all webhook events for debugging and audit:

```javascript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  webhook_event_id: event.id,
  delivery_id: req.headers['x-mcc-delivery-id'],
  event_type: event.type,
  resource_id: event.data.id,
  status: 'received',
}));
```

### 3. Set up alerts for failures

Monitor your webhook endpoint and alert on:
- Signature verification failures (possible attack)
- Processing errors (bugs in your handler)
- High latency (approaching the 30-second timeout)

### 4. Keep your endpoint fast

If processing takes more than a few seconds, offload to a background queue. Hitting the 30-second timeout triggers retries, which waste resources.

### 5. Use a separate path for webhooks

Don't mix webhook handling with your regular application routes. Use a dedicated path that is easy to monitor and debug.

### 6. Don't trust the webhook alone for high-value orders

For orders above a certain threshold, verify the payment status via API as an additional check:

```javascript
case 'payment.confirmed': {
  // Double-check via API for high-value orders
  if (data.amount > 500) {
    const verified = await mccClient.verifyPayment(data.id);
    if (!verified.verified) {
      console.error(`Payment ${data.id} not verified via API!`);
      break;
    }
  }

  await fulfillOrder(data.metadata.order_id);
  break;
}
```

---

## Troubleshooting

### Webhooks not arriving

1. Check the webhook is registered and active: `GET /webhooks`
2. Check the URL is correct and publicly accessible
3. Try the test endpoint: `POST /webhooks/{id}/test`
4. Check your server/firewall logs for blocked requests
5. Ensure your SSL certificate is valid (not expired or self-signed)

### Signature verification failing

1. Confirm you are using the raw request body, not a parsed/re-serialized version
2. Check the webhook secret is correct (no extra whitespace)
3. Ensure the timestamp header is being read correctly
4. Verify your HMAC implementation uses SHA-256

### Events arriving out of order

Events may arrive out of order (e.g., `payment.settled` before `payment.confirmed`). Design your handler to be resilient:

```javascript
// Use the status from the event data, not the event type
const currentStatus = data.status;
const statusOrder = ['pending', 'confirming', 'confirmed', 'settled'];
const currentIndex = statusOrder.indexOf(currentStatus);
const existingIndex = statusOrder.indexOf(order.mcc_status);

// Only update if the new status is "more advanced"
if (currentIndex > existingIndex) {
  await db.orders.update(orderId, { mcc_status: currentStatus });
}
```
