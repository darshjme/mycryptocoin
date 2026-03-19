# Hosted Checkout Sessions

MyCryptoCoin provides a hosted checkout page that handles the entire payment UI for you -- crypto selection, QR codes, countdown timers, and real-time status updates. No frontend development required.

---

## How It Works

1. Your server creates a **checkout session** via the API
2. You redirect the customer to the returned `checkoutUrl`
3. The customer selects a cryptocurrency and sends payment
4. MyCryptoCoin handles confirmation tracking and redirects the customer back to your `successUrl`
5. Your webhook receives the `payment.confirmed` event

---

## Creating a Checkout Session

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/checkout/session \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "99.99",
    "currency": "USD",
    "displayMode": "page",
    "customerEmail": "buyer@example.com",
    "externalId": "ORD-12345",
    "successUrl": "https://yoursite.com/orders/ORD-12345/success",
    "cancelUrl": "https://yoursite.com/orders/ORD-12345/cancel",
    "callbackUrl": "https://yoursite.com/webhooks/mycryptocoin",
    "metadata": {
      "order_id": "ORD-12345"
    }
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "checkoutUrl": "https://mycrypto.co.in/pay/cs_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "displayMode": "page",
    "expiresAt": "2026-03-19T11:00:00Z",
    "amount": "99.99",
    "currency": "USD",
    "discount": null,
    "merchantName": "Acme Digital Services"
  }
}
```

### Redirect the customer

```html
<!-- Simple link -->
<a href="https://mycrypto.co.in/pay/cs_a1b2c3...">Pay with Crypto</a>

<!-- Or redirect from your server -->
<!-- Node.js/Express: -->
<!-- res.redirect(session.checkoutUrl); -->
```

---

## Display Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `page` | Full-page checkout (default) | Standard e-commerce |
| `popup` | Opens in a modal/popup | SaaS subscription buttons |
| `inline` | Embedded in an iframe | Payment within your page |
| `hidden` | No UI, returns data only | Fully custom payment UI |

---

## Applying Discount Codes

Pass a `discountCode` in the session creation request:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/checkout/session \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "99.99",
    "currency": "USD",
    "discountCode": "SUMMER25",
    "successUrl": "https://yoursite.com/success"
  }'
```

If the code is valid, the response includes the discount details:

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_...",
    "checkoutUrl": "https://mycrypto.co.in/pay/cs_...",
    "amount": "89.99",
    "currency": "USD",
    "discount": {
      "code": "SUMMER25",
      "discountAmount": "10.00",
      "finalAmount": "89.99"
    }
  }
}
```

---

## Restricting Cryptocurrencies

Limit which cryptocurrencies appear on the checkout page:

```json
{
  "amount": "50.00",
  "allowedCryptos": ["ETHEREUM:USDT", "TRON:USDT", "BITCOIN:BTC"],
  "successUrl": "https://yoursite.com/success"
}
```

This is useful if you only want to accept stablecoins or specific chains.

---

## Polling Session Status

If you need real-time status updates without webhooks (e.g., for a single-page app):

```bash
curl https://api.mycrypto.co.in/api/v1/checkout/cs_a1b2c3.../status \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_a1b2c3...",
    "status": "pending",
    "paymentId": null,
    "payment": null,
    "expiresAt": "2026-03-19T11:00:00Z"
  }
}
```

Poll every 3-5 seconds. Once `payment.status` is `confirmed`, redirect the customer.

---

## White-Label Theming

Checkout sessions automatically apply your white-label configuration. See the [White-Label Guide](./whitelabel.md) for customization options including custom colors, logo, domain, and CSS.

---

## Session Expiry

Checkout sessions expire after **30 minutes**. After expiry:

- The checkout page shows an "expired" message
- The `GET /checkout/{sessionId}` endpoint returns `410 Gone`
- Any associated payment is also marked as expired
