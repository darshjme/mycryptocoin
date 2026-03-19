# Webhooks API

Webhooks send real-time HTTP POST notifications to your server when events occur. Use them to automate order fulfillment, update payment status, and track withdrawals.

---

## Event Types

| Event | Description |
|-------|-------------|
| `payment.created` | A new payment was created |
| `payment.confirming` | Transaction detected, awaiting confirmations |
| `payment.confirmed` | Payment received required confirmations |
| `payment.completed` | Funds credited to your wallet |
| `payment.expired` | Payment window expired with no transaction |
| `payment.failed` | Payment failed (underpaid, wrong token) |
| `withdrawal.initiated` | Withdrawal request submitted for processing |
| `withdrawal.completed` | Withdrawal confirmed on-chain |
| `withdrawal.failed` | Withdrawal failed |

---

## Webhook Payload

Every webhook event is an HTTP POST request with a JSON body:

```json
{
  "event": "payment.confirmed",
  "timestamp": "2026-03-19T10:45:22Z",
  "webhookId": "whk_m1n2o3p4q5",
  "data": {
    "id": "pay_1a2b3c4d5e6f",
    "merchant_id": "mch_a1b2c3d4e5f6",
    "status": "confirmed",
    "amount": 99.99,
    "currency": "USD",
    "crypto": "USDT",
    "crypto_amount": "99.990000",
    "exchange_rate": "1.0000",
    "fee_amount": "0.499950",
    "net_amount": "99.490050",
    "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "network": "ethereum",
    "tx_hash": "0xabc123def456789...",
    "confirmations": 12,
    "required_confirmations": 12,
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "confirmed_at": "2026-03-19T10:45:22Z",
    "created_at": "2026-03-19T10:30:00Z"
  }
}
```

### Headers Sent with Webhooks

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `X-MCC-Signature` | HMAC-SHA256 hex signature of the raw request body |
| `X-MCC-Event` | Event type (e.g., `payment.confirmed`) |
| `X-MCC-Timestamp` | ISO 8601 timestamp of the delivery (from the payload) |
| `User-Agent` | `MyCryptoCoin-Webhook/1.0` |

> **Note:** The actual backend does not send an `X-MCC-Delivery-Id` header. Use the `webhookId` field inside the payload body for idempotency tracking.

---

## Signature Verification

Every webhook request includes an `X-MCC-Signature` header containing an HMAC-SHA256 signature. You must verify this signature to ensure the request came from MyCryptoCoin and was not tampered with.

The signature is computed as:

```
HMAC-SHA256(webhook_secret, raw_body)
```

Where:
- `webhook_secret` is the hex secret returned when you created the webhook
- `raw_body` is the raw JSON request body string (not parsed)

The header value is the raw hex digest (no prefix).

### Verification -- Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req, webhookSecret) {
  const signature = req.headers['x-mcc-signature'];
  const body = req.rawBody; // Raw request body as string

  if (!signature || !body) {
    return false;
  }

  // Optionally reject old requests using the timestamp in the body
  const parsed = JSON.parse(body);
  const deliveryTime = new Date(parsed.timestamp).getTime();
  if (Math.abs(Date.now() - deliveryTime) > 300000) {
    return false; // Reject requests older than 5 minutes
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expectedSignature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
```

### Verification -- Python

```python
import hmac
import hashlib
import json
import time
from datetime import datetime

def verify_webhook_signature(headers, body, webhook_secret):
    signature = headers.get('X-MCC-Signature', '')

    if not signature or not body:
        return False

    # Optionally reject old requests
    parsed = json.loads(body)
    delivery_time = datetime.fromisoformat(parsed['timestamp'].replace('Z', '+00:00'))
    if abs(time.time() - delivery_time.timestamp()) > 300:
        return False

    expected_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
```

### Verification -- PHP

```php
function verifyWebhookSignature($headers, $body, $webhookSecret) {
    $signature = $headers['X-MCC-Signature'] ?? '';

    if (empty($signature) || empty($body)) {
        return false;
    }

    // Optionally reject old requests
    $parsed = json_decode($body, true);
    $deliveryTime = strtotime($parsed['timestamp']);
    if (abs(time() - $deliveryTime) > 300) {
        return false;
    }

    $expectedSignature = hash_hmac('sha256', $body, $webhookSecret);

    return hash_equals($expectedSignature, $signature);
}
```

---

## Retry Policy

If your endpoint does not respond with a `2xx` status code within 10 seconds, MyCryptoCoin retries the delivery:

| Attempt | Delay After Previous |
|---------|---------------------|
| 1st retry | 5 seconds |
| 2nd retry | 30 seconds |
| 3rd retry | 2 minutes |

After 3 total attempts (1 initial + 2 retries), the delivery is marked as failed and the webhook's failure count is incremented. After 10 consecutive failures, the webhook endpoint is automatically disabled.

### Best Practices for Reliability

1. **Respond quickly.** Return a `200` status immediately and process the event asynchronously.
2. **Handle duplicates.** Use the `X-MCC-Delivery-Id` header to detect and skip duplicate deliveries.
3. **Process idempotently.** The same event may be delivered more than once. Ensure your handler produces the same result.

---

## Register Webhook

```
POST /webhooks
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | HTTPS endpoint URL |
| `events` | array | Yes | Event types to subscribe to |
| `description` | string | No | Descriptive label (max 200 chars) |
| `active` | boolean | No | Whether the webhook is active (default: true) |

### Example Request

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed", "withdrawal.completed"],
    "description": "Production payment notifications"
  }'
```

### Example Response (201 Created)

```json
{
  "id": "whk_m1n2o3p4q5",
  "url": "https://yoursite.com/webhooks/mycryptocoin",
  "events": ["payment.confirmed", "payment.failed", "withdrawal.completed"],
  "description": "Production payment notifications",
  "active": true,
  "secret": "whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "last_delivery": null,
  "created_at": "2026-03-19T08:00:00Z",
  "updated_at": "2026-03-19T08:00:00Z"
}
```

> **Important:** The `secret` field is returned only on creation. Copy and store it securely. You will need it for signature verification.

---

## List Webhooks

```
GET /webhooks
```

### Example Request

```bash
curl https://api.mycrypto.co.in/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example Response (200 OK)

```json
{
  "data": [
    {
      "id": "whk_m1n2o3p4q5",
      "url": "https://yoursite.com/webhooks/mycryptocoin",
      "events": ["payment.confirmed", "payment.failed", "withdrawal.completed"],
      "description": "Production payment notifications",
      "active": true,
      "secret": null,
      "last_delivery": {
        "event": "payment.confirmed",
        "status_code": 200,
        "delivered_at": "2026-03-19T10:45:30Z"
      },
      "created_at": "2026-03-19T08:00:00Z",
      "updated_at": "2026-03-19T10:45:30Z"
    }
  ]
}
```

> **Note:** The `secret` is not returned on list requests. It is only shown at creation time.

---

## Update Webhook

```
PUT /webhooks/{id}
```

### Example Request

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["*"],
    "description": "All events"
  }'
```

### Example Response (200 OK)

```json
{
  "id": "whk_m1n2o3p4q5",
  "url": "https://yoursite.com/webhooks/mycryptocoin",
  "events": ["*"],
  "description": "All events",
  "active": true,
  "secret": null,
  "last_delivery": {
    "event": "payment.confirmed",
    "status_code": 200,
    "delivered_at": "2026-03-19T10:45:30Z"
  },
  "created_at": "2026-03-19T08:00:00Z",
  "updated_at": "2026-03-19T11:00:00Z"
}
```

---

## Delete Webhook

```
DELETE /webhooks/{id}
```

### Example Request

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example Response (200 OK)

```json
{
  "message": "Webhook whk_m1n2o3p4q5 deleted."
}
```

---

## Test Webhook

Send a test event to verify your endpoint is working.

```
POST /webhooks/{id}/test
```

### Example Request

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example Response (200 OK)

```json
{
  "id": "whk_m1n2o3p4q5",
  "test_event": "payment.confirmed",
  "delivery": {
    "status_code": 200,
    "response_time_ms": 234,
    "success": true
  },
  "message": "Test event delivered successfully."
}
```

If your endpoint fails:

```json
{
  "id": "whk_m1n2o3p4q5",
  "test_event": "payment.confirmed",
  "delivery": {
    "status_code": 500,
    "response_time_ms": 5023,
    "success": false
  },
  "message": "Test event delivery failed. Check your endpoint."
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_url` | URL is not a valid HTTPS endpoint |
| 400 | `invalid_events` | One or more event types are not valid |
| 400 | `max_webhooks_reached` | Maximum of 10 webhook endpoints per merchant |
| 401 | `authentication_required` | Missing authentication |
| 404 | `not_found` | Webhook ID does not exist |
| 500 | `internal_error` | Server error |
