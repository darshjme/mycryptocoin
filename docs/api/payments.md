# Payments API

Create, list, and verify cryptocurrency payments. This is the core of the MyCryptoCoin integration.

---

## Payment Lifecycle

Every payment follows this status flow:

```
pending --> confirming --> confirmed --> settled
   |                         |
   +--> expired              +--> refunded
   |
   +--> failed
```

| Status | Description |
|--------|-------------|
| `pending` | Payment created, waiting for customer to send crypto |
| `confirming` | Transaction detected on-chain, waiting for block confirmations |
| `confirmed` | Required confirmations reached, payment is verified |
| `settled` | Funds credited to your MyCryptoCoin wallet |
| `expired` | No transaction received before the expiry window |
| `failed` | Transaction failed (underpaid, wrong token, network error) |
| `refunded` | Payment was refunded to the customer |

---

## Create Payment

Creates a new crypto payment and returns a unique deposit address.

```
POST /payments
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Payment amount in fiat currency |
| `currency` | string | Yes | ISO 4217 currency code (USD, EUR, GBP, INR, AED, SGD, AUD, CAD, JPY) |
| `crypto` | string | Yes | Cryptocurrency to accept (BTC, ETH, USDT, etc.) |
| `description` | string | No | Description shown to customer (max 500 chars) |
| `metadata` | object | No | Up to 20 key-value pairs for your reference |
| `callback_url` | string | No | Webhook URL for this specific payment |
| `redirect_url` | string | No | URL to redirect customer after payment |
| `expiry_minutes` | integer | No | Expiry window in minutes (5-1440, default: 30) |

### Example Request

```bash
curl -X POST https://api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "crypto": "USDT",
    "description": "Premium subscription - March 2026",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "callback_url": "https://yoursite.com/webhooks/crypto",
    "redirect_url": "https://yoursite.com/order/success",
    "expiry_minutes": 30
  }'
```

### Example Response (201 Created)

```json
{
  "id": "pay_1a2b3c4d5e6f",
  "merchant_id": "mch_a1b2c3d4e5f6",
  "status": "pending",
  "amount": 99.99,
  "currency": "USD",
  "crypto": "USDT",
  "crypto_amount": "99.990000",
  "exchange_rate": "1.0000",
  "fee_amount": "0.499950",
  "fee_percent": "0.5",
  "net_amount": "99.490050",
  "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "network": "ethereum",
  "tx_hash": null,
  "confirmations": 0,
  "required_confirmations": 12,
  "description": "Premium subscription - March 2026",
  "metadata": {
    "order_id": "ORD-12345",
    "customer_email": "buyer@example.com"
  },
  "callback_url": "https://yoursite.com/webhooks/crypto",
  "redirect_url": "https://yoursite.com/order/success",
  "checkout_url": "https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f",
  "qr_code_url": "https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/qr",
  "expires_at": "2026-03-19T11:00:00Z",
  "confirmed_at": null,
  "settled_at": null,
  "created_at": "2026-03-19T10:30:00Z",
  "updated_at": "2026-03-19T10:30:00Z"
}
```

### Integration Options

After creating a payment, you have two ways to collect payment:

**Option A: Hosted Checkout (recommended)**

Redirect the customer to the `checkout_url`. MyCryptoCoin handles the payment UI, QR code, countdown timer, and confirmation screen.

```html
<a href="https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f">Pay with Crypto</a>
```

**Option B: Custom UI**

Use the `deposit_address`, `crypto_amount`, and `qr_code_url` to build your own payment interface.

```html
<p>Send exactly <strong>99.990000 USDT</strong> to:</p>
<code>0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18</code>
<img src="https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/qr" alt="QR Code" />
```

---

## List Payments

Retrieve a paginated list of payments with optional filters.

```
GET /payments
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | -- | Filter by status |
| `crypto` | string | -- | Filter by cryptocurrency |
| `date_from` | string | -- | Start date (YYYY-MM-DD) |
| `date_to` | string | -- | End date (YYYY-MM-DD) |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

### Example Request

```bash
curl "https://api.mycrypto.co.in/v1/payments?status=confirmed&crypto=USDT&page=1&limit=10" \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

```json
{
  "data": [
    {
      "id": "pay_1a2b3c4d5e6f",
      "status": "confirmed",
      "amount": 99.99,
      "currency": "USD",
      "crypto": "USDT",
      "crypto_amount": "99.990000",
      "exchange_rate": "1.0000",
      "fee_amount": "0.499950",
      "fee_percent": "0.5",
      "net_amount": "99.490050",
      "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      "network": "ethereum",
      "tx_hash": "0xabc123def456789...",
      "confirmations": 12,
      "required_confirmations": 12,
      "description": "Premium subscription - March 2026",
      "metadata": {
        "order_id": "ORD-12345",
        "customer_email": "buyer@example.com"
      },
      "callback_url": "https://yoursite.com/webhooks/crypto",
      "redirect_url": "https://yoursite.com/order/success",
      "checkout_url": "https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f",
      "qr_code_url": "https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/qr",
      "expires_at": "2026-03-19T11:00:00Z",
      "confirmed_at": "2026-03-19T10:45:22Z",
      "settled_at": "2026-03-19T10:45:30Z",
      "created_at": "2026-03-19T10:30:00Z",
      "updated_at": "2026-03-19T10:45:30Z"
    }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

---

## Get Payment

Retrieve full details of a specific payment.

```
GET /payments/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Payment ID (e.g., `pay_1a2b3c4d5e6f`) |

### Example Request

```bash
curl https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

Returns the full Payment object (same structure as create response).

---

## Verify Payment

Perform a real-time blockchain check on a payment's status. Use this as a fallback when you missed a webhook or want to double-check before fulfilling an order.

```
POST /payments/{id}/verify
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Payment ID |

### Example Request

```bash
curl -X POST https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/verify \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

```json
{
  "id": "pay_1a2b3c4d5e6f",
  "status": "confirmed",
  "confirmations": 12,
  "required_confirmations": 12,
  "tx_hash": "0xabc123def456789...",
  "verified": true
}
```

### Verification Logic

| `verified` | `status` | Action |
|------------|----------|--------|
| `true` | `confirmed` or `settled` | Safe to fulfill the order |
| `false` | `confirming` | Wait for more confirmations |
| `false` | `pending` | Customer hasn't paid yet |
| `false` | `expired` | Payment window closed |
| `false` | `failed` | Transaction failed |

---

## Payment Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique payment identifier (prefix: `pay_`) |
| `merchant_id` | string | Your merchant ID |
| `status` | string | Current payment status |
| `amount` | number | Fiat amount requested |
| `currency` | string | Fiat currency code |
| `crypto` | string | Cryptocurrency accepted |
| `crypto_amount` | string | Exact crypto amount (string for precision) |
| `exchange_rate` | string | Fiat-to-crypto rate at creation time |
| `fee_amount` | string | MyCryptoCoin fee (0.5% of crypto_amount) |
| `fee_percent` | string | Fee percentage ("0.5") |
| `net_amount` | string | crypto_amount minus fee_amount |
| `deposit_address` | string | Unique address for this payment |
| `network` | string | Blockchain network (ethereum, bitcoin, etc.) |
| `tx_hash` | string/null | On-chain transaction hash |
| `confirmations` | integer | Current block confirmations |
| `required_confirmations` | integer | Confirmations needed |
| `description` | string | Payment description |
| `metadata` | object | Your custom key-value pairs |
| `callback_url` | string | Webhook URL for this payment |
| `redirect_url` | string | Post-payment redirect URL |
| `checkout_url` | string | Hosted checkout page URL |
| `qr_code_url` | string | QR code image URL |
| `expires_at` | string | ISO 8601 expiry timestamp |
| `confirmed_at` | string/null | When payment was confirmed |
| `settled_at` | string/null | When funds were settled |
| `created_at` | string | When payment was created |
| `updated_at` | string | Last update timestamp |

---

## Confirmation Requirements

Different cryptocurrencies require different numbers of block confirmations:

| Crypto | Confirmations | Approximate Time |
|--------|---------------|-----------------|
| BTC | 3 | ~30 minutes |
| ETH | 12 | ~3 minutes |
| USDT (ERC-20) | 12 | ~3 minutes |
| USDT (TRC-20) | 20 | ~1 minute |
| USDC | 12 | ~3 minutes |
| BNB | 15 | ~1 minute |
| SOL | 32 | ~15 seconds |
| MATIC | 128 | ~5 minutes |
| LTC | 6 | ~15 minutes |
| XRP | 1 | ~4 seconds |
| DOGE | 40 | ~40 minutes |

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Missing or invalid fields |
| 400 | `unsupported_currency` | Fiat currency not supported |
| 400 | `unsupported_crypto` | Cryptocurrency not supported |
| 400 | `amount_too_small` | Amount below minimum threshold |
| 400 | `invalid_callback_url` | Callback URL is not a valid HTTPS URL |
| 401 | `authentication_required` | Missing authentication |
| 404 | `not_found` | Payment ID does not exist |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Server error |

---

## Underpayment Handling

If a customer sends less than the required `crypto_amount`:

1. The payment status moves to `failed` with reason `underpaid`
2. A `payment.failed` webhook is sent with underpayment details
3. The partial amount is held for 72 hours
4. Contact support to arrange a refund or request the customer to send the remaining amount

```json
{
  "error": {
    "code": "underpaid",
    "message": "Payment was underpaid.",
    "details": {
      "expected": "99.990000",
      "received": "50.000000",
      "difference": "49.990000"
    }
  }
}
```

---

## Overpayment Handling

If a customer sends more than the required `crypto_amount`:

1. The payment is confirmed normally
2. The excess amount is credited to your wallet
3. It is your responsibility to refund any overpayment to the customer
