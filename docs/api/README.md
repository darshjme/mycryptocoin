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

## Supported Cryptocurrencies

| Symbol | Name | Networks | Min Withdrawal | Required Confirmations |
|--------|------|----------|---------------|----------------------|
| BTC | Bitcoin | bitcoin | 0.0001 | 3 |
| ETH | Ethereum | ethereum | 0.001 | 12 |
| USDT | Tether | ethereum, tron, bsc, polygon | 1.00 | 12 (ETH), 20 (TRX) |
| USDC | USD Coin | ethereum, polygon, solana, arbitrum | 1.00 | 12 (ETH) |
| BNB | BNB | bsc | 0.001 | 15 |
| SOL | Solana | solana | 0.01 | 32 |
| MATIC | Polygon | polygon | 1.00 | 128 |
| DOGE | Dogecoin | dogecoin | 5.00 | 40 |
| LTC | Litecoin | litecoin | 0.001 | 6 |
| XRP | XRP | ripple | 0.10 | 1 |
| ADA | Cardano | cardano | 1.00 | 15 |
| DOT | Polkadot | polkadot | 1.00 | 25 |
| AVAX | Avalanche | avalanche | 0.01 | 12 |
| TRX | TRON | tron | 1.00 | 20 |
| LINK | Chainlink | ethereum | 0.10 | 12 |
| UNI | Uniswap | ethereum | 0.10 | 12 |
| SHIB | Shiba Inu | ethereum | 100000 | 12 |
| APE | ApeCoin | ethereum | 1.00 | 12 |
| ARB | Arbitrum | arbitrum | 0.10 | 12 |
| OP | Optimism | optimism | 0.10 | 12 |

---

## Supported Fiat Currencies

USD, EUR, GBP, INR, AED, SGD, AUD, CAD, JPY

Payments are priced in fiat and converted to crypto at the current exchange rate at the time of payment creation.

---

## SDKs and Libraries

Official SDKs are coming soon. In the meantime, use the REST API directly with any HTTP client. See [SDK Examples](../guides/sdk-examples.md) for copy-paste code in JavaScript, Python, PHP, and cURL.

---

## Support

- **Developer Portal:** https://developers.mycrypto.co.in
- **Email:** developers@mycrypto.co.in
- **WhatsApp Support:** +91-9876543210
- **Status Page:** https://status.mycrypto.co.in
