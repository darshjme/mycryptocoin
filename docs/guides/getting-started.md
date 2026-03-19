# Getting Started with MyCryptoCoin

Accept cryptocurrency payments in under 10 minutes. This guide walks you through the complete setup.

---

## 1. Create an Account

1. Go to [dashboard.mycrypto.co.in/register](https://dashboard.mycrypto.co.in/register)
2. Enter your email, password, business name, and WhatsApp number
3. Verify your WhatsApp number with the 6-digit OTP
4. Complete your merchant profile (logo, website, supported cryptos)

Or register via API:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123!",
    "businessName": "My Business",
    "phone": "+919876543210"
  }'
```

---

## 2. Generate an API Key

1. Go to **Dashboard > Settings > API Keys**
2. Click **Generate New Key**
3. Name: "Production Server", Mode: **Test** (for now)
4. Permissions: `payments:read`, `payments:write`
5. Copy the key immediately (shown only once)

Or via API:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development",
    "mode": "test",
    "permissions": ["payments:read", "payments:write", "wallets:read"]
  }'
```

---

## 3. Create Your First Payment

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/create \
  -H "X-API-Key: mcc_test_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": "USDT_ERC20",
    "amount": "25.00",
    "currency": "USD",
    "description": "Test payment",
    "callbackUrl": "https://yoursite.com/webhooks/crypto",
    "redirectUrl": "https://yoursite.com/success",
    "expiryMinutes": 30
  }'
```

The response includes:
- `checkout_url` -- Redirect your customer here
- `deposit_address` -- For building your own payment UI
- `qr_code_url` -- QR code image for the deposit address

---

## 4. Set Up Webhooks

Register an endpoint to receive real-time payment notifications:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed", "payment.expired"]
  }'
```

Store the `secret` from the response -- you need it to verify webhook signatures.

See the [Webhook Guide](./webhook-guide.md) for signature verification code in Node.js, Python, PHP, Ruby, and Go.

---

## 5. Test the Integration

In test mode (`mcc_test_` keys):
- Payments auto-confirm after 30 seconds
- No real blockchain transactions occur
- Use the sandbox base URL or the same production URL with test keys

---

## 6. Go Live

1. Generate a **live** API key (`mcc_live_`)
2. Replace the test key in your integration
3. Verify your webhook endpoint works with real events
4. Make a small real payment to confirm everything works end-to-end

---

## Next Steps

- [SDK Examples](./sdk-examples.md) -- Copy-paste code in JS, Python, PHP, Ruby, and cURL
- [Hosted Checkout](./checkout-sessions.md) -- Use our hosted payment page
- [Invoices](./invoices.md) -- Send professional invoices with payment links
- [Webhook Guide](./webhook-guide.md) -- Deep dive into webhook handling
- [WordPress Setup](./wordpress-setup.md) -- WooCommerce plugin integration
- [Security](./security.md) -- API key management, webhook verification, IP whitelisting
- [White-Label](./whitelabel.md) -- Customize your checkout branding
- [Discount Codes](./discount-codes.md) -- Create and manage coupons
- [Refunds](./refunds.md) -- Process full and partial refunds
- [Exchange Rates](./exchange-rates.md) -- Public rate data API
