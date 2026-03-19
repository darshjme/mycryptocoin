# MyCryptoCoin API Reference

**The Stripe of Crypto Payments** -- Accept Bitcoin, Ethereum, USDT, and 20+ cryptocurrencies with a single integration.

- **Base URL (Production):** `https://api.mycrypto.co.in/v1`
- **Base URL (Sandbox):** `https://sandbox.api.mycrypto.co.in/v1`
- **Current Version:** v1
- **Transaction Fee:** 0.5% per payment

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [Authentication](authentication.md) | API keys, Bearer tokens, and auth flows |
| [Payments](payments.md) | Create and manage crypto payments |
| [Wallets](wallets.md) | View balances and configure auto-withdrawal |
| [Withdrawals](withdrawals.md) | Withdraw crypto to external wallets |
| [Webhooks](webhooks.md) | Real-time event notifications |
| [Errors](errors.md) | Error codes and troubleshooting |
| [Rate Limits](rate-limits.md) | Rate limiting per endpoint |
| **New Endpoints** | |
| Invoices | `POST/GET/PUT/DELETE /invoices` -- Professional crypto invoices with line items and tax |
| Refunds | `POST /payments/:id/refund`, `GET /refunds` -- Full and partial refunds |
| Checkout Sessions | `POST /checkout/session`, `GET /checkout/:id` -- Hosted checkout pages |
| Exchange Rates | `GET /rates` -- Public exchange rates (no auth, 60s cache) |
| Discounts | `POST/GET/DELETE /discounts` -- Coupon and discount code management |
| White-Label | `GET/PUT /whitelabel` -- Customize checkout branding and domain |

---

## Authentication

All API requests must be authenticated using one of two methods:

### 1. API Key (recommended for server-to-server)

Pass your API key in the `X-API-Key` header:

```bash
curl https://api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

API keys are prefixed to indicate their environment:
- `mcc_live_` -- Production keys process real transactions
- `mcc_test_` -- Test keys work with the sandbox environment only

### 2. Bearer Token (recommended for dashboard / frontend)

Pass a JWT token in the `Authorization` header:

```bash
curl https://api.mycrypto.co.in/v1/payments \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

Bearer tokens are obtained from the `/auth/login` endpoint and expire after 24 hours. Use `/auth/refresh` to get a new token without re-authenticating.

See the full [Authentication Guide](authentication.md) for details.

---

## Versioning

The API is versioned via the URL path (`/v1/`). When breaking changes are introduced, a new version will be released (e.g., `/v2/`). Previous versions remain available for at least 12 months after a new version is released.

Non-breaking changes (new optional fields, new endpoints) are added to the current version without incrementing.

---

## Request Format

- All request bodies must be JSON with `Content-Type: application/json`
- All string parameters are UTF-8 encoded
- Monetary amounts use strings for precision (e.g., `"99.990000"` not `99.99`)
- Dates use ISO 8601 format: `2026-03-19T10:30:00Z`
- All timestamps are UTC

---

## Response Format

Every successful response returns a JSON object. List endpoints return a `data` array with a `pagination` object:

```json
{
  "data": [
    { "id": "pay_1a2b3c4d5e6f", "status": "confirmed", "..." : "..." }
  ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

Single-resource endpoints return the resource directly:

```json
{
  "id": "pay_1a2b3c4d5e6f",
  "status": "confirmed",
  "amount": 99.99,
  "...": "..."
}
```

---

## Pagination

All list endpoints support pagination with these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |

The response includes a `pagination` object:

| Field | Description |
|-------|-------------|
| `total` | Total number of records matching the query |
| `page` | Current page number |
| `limit` | Records per page |
| `pages` | Total number of pages |

---

## Error Format

All errors use a consistent JSON structure:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The 'amount' field is required.",
    "details": {
      "field": "amount",
      "reason": "required"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code |
| `message` | string | Human-readable description |
| `details` | object | Additional context (optional) |

See the full [Error Reference](errors.md) for all error codes.

---

## Rate Limits

Every response includes rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

When you exceed the rate limit, you receive a `429 Too Many Requests` response with:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Retry after 30 seconds.",
    "details": {
      "retry_after": 30
    }
  }
}
```

Default limits:
- **Payment creation:** 100 requests/minute
- **Read endpoints:** 300 requests/minute
- **Auth endpoints:** 20 requests/minute

See [Rate Limits](rate-limits.md) for per-endpoint details.

---

## Webhook Security

Webhook payloads are signed with HMAC-SHA256. The signature is sent in the `X-MCC-Signature` header. Always verify the signature before processing a webhook event.

```
X-MCC-Signature: sha256=a1b2c3d4e5f6...
```

See the [Webhook Guide](webhooks.md) for verification code examples.

---

## Request IDs

Every response includes an `X-Request-Id` header containing a unique UUID. Include this ID when contacting support to help us trace your request.

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

---

## Test Mode

Use test mode to develop and test your integration without processing real transactions:

1. Generate a **test** API key from your dashboard (prefixed `mcc_test_`)
2. Use the sandbox base URL: `https://sandbox.api.mycrypto.co.in/v1`
3. Test payments auto-confirm after 30 seconds
4. Test wallets have pre-funded balances
5. Test withdrawals simulate blockchain processing

Test mode data is completely isolated from production.

---

## Supported Cryptocurrencies (30+)

### Native Coins
| Symbol | Name | Network | Min Withdrawal | Confirmations |
|--------|------|---------|---------------|---------------|
| BTC | Bitcoin | BITCOIN | 0.0001 | 3 |
| BTC (LN) | Bitcoin Lightning | LIGHTNING | 0.000001 | 0 (instant) |
| ETH | Ethereum | ETHEREUM | 0.001 | 12 |
| SOL | Solana | SOLANA | 0.01 | 1 |
| BNB | BNB | BSC | 0.01 | 15 |
| TRX | TRON | TRON | 10 | 20 |
| LTC | Litecoin | LITECOIN | 0.01 | 6 |
| MATIC | Polygon | POLYGON | 1 | 30 |
| AVAX | Avalanche | AVALANCHE | 0.1 | 12 |
| DOT | Polkadot | POLKADOT | 1 | 12 |
| ADA | Cardano | CARDANO | 5 | 15 |
| DOGE | Dogecoin | DOGECOIN | 10 | 6 |
| XRP | XRP | XRPL | 1 | 1 |
| XMR | Monero | MONERO | 0.01 | 10 |
| ZEC | Zcash | ZCASH | 0.01 | 10 |
| BCH | Bitcoin Cash | BITCOIN_CASH | 0.01 | 6 |

### L2 Rollups
| Symbol | Name | Network | Min Withdrawal | Confirmations |
|--------|------|---------|---------------|---------------|
| ETH | Ethereum (Arbitrum) | ARBITRUM | 0.001 | 12 |
| ETH | Ethereum (Optimism) | OPTIMISM | 0.001 | 12 |
| ETH | Ethereum (Base) | BASE | 0.001 | 12 |

### Stablecoins
| Symbol | Name | Networks | Min Withdrawal | Confirmations |
|--------|------|----------|---------------|---------------|
| USDT | Tether | ETHEREUM, TRON | 10 | 12 (ETH), 20 (TRX) |
| USDC | USD Coin | ETHEREUM, POLYGON, ARBITRUM, OPTIMISM, BASE | 10 | 12-30 |
| DAI | Dai | ETHEREUM | 10 | 12 |

### ERC-20 Tokens
| Symbol | Name | Network | Min Withdrawal | Confirmations |
|--------|------|---------|---------------|---------------|
| LINK | Chainlink | ETHEREUM | 1 | 12 |
| UNI | Uniswap | ETHEREUM | 1 | 12 |
| AAVE | Aave | ETHEREUM | 0.1 | 12 |
| SHIB | Shiba Inu | ETHEREUM | 1,000,000 | 12 |
| PEPE | Pepe | ETHEREUM | 10,000,000 | 12 |

### Custom Tokens
Merchants can add any ERC-20, BEP-20, or TRC-20 token by providing the contract address.
The API validates the contract and fetches token info (name, symbol, decimals) automatically.

---

## Supported Fiat Currencies

USD, EUR, GBP, INR, AED, SGD, AUD, CAD, JPY, CHF, CNY, KRW, BRL, MXN, ZAR, TRY, SEK, NOK, DKK, PLN, THB, IDR, MYR, PHP, VND, NGN, KES, ARS, CLP, COP, PEN, UAH, CZK, HUF, ILS, TWD, HKD, NZD, RUB, SAR, QAR, BHD, KWD, OMR, EGP, PKR, BDT, LKR

Payments are priced in fiat and converted to crypto at the current exchange rate at the time of payment creation.

---

## Lightning Network

Near-instant Bitcoin payments via Lightning Network (BOLT11):

```bash
# Create a Lightning payment
curl -X POST https://api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_live_..." \
  -d '{"network": "LIGHTNING", "token": "BTC", "amount": "0.001", "currency": "BTC"}'
```

- Settlement in under 3 seconds
- Near-zero fees
- Minimum amount: 1 satoshi (0.00000001 BTC)
- No confirmations required

---

## Hosted Checkout

Create a hosted checkout session that renders a beautiful payment page:

```bash
# Create checkout session
curl -X POST https://api.mycrypto.co.in/v1/checkout/session \
  -H "Authorization: Bearer ..." \
  -d '{"amount": "99.99", "currency": "USD", "displayMode": "popup"}'

# Response: { "data": { "sessionId": "cs_abc123", "checkoutUrl": "https://mycrypto.co.in/pay/cs_abc123" } }
```

**Display Modes:**
- `page` -- Full redirect to hosted checkout
- `popup` -- Embed `<script src="https://mycrypto.co.in/embed.js">` and call `MyCryptoCoin.checkout()`
- `inline` -- Render checkout inline with `MyCryptoCoin.renderInline(element, opts)`
- `hidden` -- API-only, no UI (merchant builds own checkout)

---

## Invoices

Generate professional invoices with line items, tax, and email delivery:

```bash
POST /invoices              # Create invoice
GET  /invoices              # List invoices
GET  /invoices/:id          # Get single invoice
PUT  /invoices/:id          # Update invoice (DRAFT only)
POST /invoices/:id/send     # Email invoice to customer
DELETE /invoices/:id        # Cancel invoice
```

Invoice statuses: `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED`

---

## Refunds

Initiate full or partial refunds for completed payments:

```bash
POST /payments/:id/refund   # Initiate refund
GET  /refunds               # List refunds
GET  /refunds/:id           # Get single refund
```

Options: refund in original crypto or USDT. Webhook event: `refund.completed`.

---

## Discount Codes

Create and validate discount/coupon codes:

```bash
POST /discounts             # Create discount
GET  /discounts             # List discounts
POST /discounts/validate    # Validate code against amount
DELETE /discounts/:id       # Deactivate
```

Supports: percentage, fixed amount, max uses, per-customer limits, expiry dates.

---

## Exchange Rates (Public)

No authentication required:

```bash
GET /rates       # All rates (cached 60s)
GET /rates/BTC   # Specific crypto
```

Response: `{ "crypto": "BITCOIN:BTC", "usdRate": 65000, "usdtRate": 65000, "btcRate": 1, "change24h": 2.5, "lastUpdated": "..." }`

---

## White-Label

Customize the checkout experience:

```bash
GET  /whitelabel                # Get config
PUT  /whitelabel                # Update config
POST /whitelabel/verify-domain  # Verify CNAME for custom domain
```

Options: logo, colors, custom domain (CNAME), remove branding (premium), custom email sender name.

---

## Testnet Support

Toggle between testnet and mainnet via API key prefix:
- `mcc_test_...` -- Uses testnets (Bitcoin Testnet3, Ethereum Sepolia, Solana Devnet, TRON Nile, BSC Testnet, etc.)
- `mcc_live_...` -- Uses mainnet

---

## Multi-Language Support

40+ languages supported with RTL detection (Arabic, Hebrew, Persian, Urdu). Set language via `Accept-Language` header or `?lang=` query parameter.

---

## Integrations

| Platform | Guide |
|----------|-------|
| Shopify | [Shopify Setup Guide](../guides/shopify-setup.md) |
| WordPress | [WordPress Setup Guide](../guides/wordpress-setup.md) |
| Custom API | [Integration Guide](../guides/integration-guide.md) |

---

## SDKs and Libraries

Official SDKs are coming soon. In the meantime, use the REST API directly with any HTTP client. See [SDK Examples](../guides/sdk-examples.md) for copy-paste code in JavaScript, Python, PHP, and cURL.

---

## Support

- **Developer Portal:** https://developers.mycrypto.co.in
- **Email:** developers@mycrypto.co.in
- **WhatsApp Support:** +91-9876543210
- **Status Page:** https://status.mycrypto.co.in
