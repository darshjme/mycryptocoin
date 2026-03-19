# Rate Limits

MyCryptoCoin enforces rate limits to ensure fair usage and protect the platform from abuse. Limits vary by endpoint category and plan.

---

## Rate Limit Headers

Every API response includes rate limit information in the headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests per window | `100` |
| `X-RateLimit-Remaining` | Requests remaining in the current window | `87` |
| `X-RateLimit-Reset` | Unix timestamp when the window resets | `1742385600` |

---

## Default Limits by Endpoint

Rate limit windows are 1 minute unless otherwise noted.

### Authentication Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/register` | 5 | 1 hour |
| `POST /auth/login` | 20 | 1 minute |
| `POST /auth/verify-otp` | 10 | 1 minute |
| `POST /auth/refresh` | 30 | 1 minute |
| `POST /auth/forgot-password` | 5 | 1 hour |
| `POST /auth/reset-password` | 5 | 1 hour |

### Payment Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /payments` | 100 | 1 minute |
| `GET /payments` | 300 | 1 minute |
| `GET /payments/{id}` | 300 | 1 minute |
| `POST /payments/{id}/verify` | 60 | 1 minute |

### Wallet Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /wallets` | 300 | 1 minute |
| `GET /wallets/{crypto}` | 300 | 1 minute |
| `PUT /wallets/{crypto}/auto-withdraw` | 10 | 1 minute |

### Withdrawal Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /withdrawals` | 30 | 1 minute |
| `GET /withdrawals` | 300 | 1 minute |
| `GET /withdrawals/{id}` | 300 | 1 minute |

### Transaction Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /transactions` | 300 | 1 minute |

### Webhook Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /webhooks` | 10 | 1 minute |
| `GET /webhooks` | 300 | 1 minute |
| `PUT /webhooks/{id}` | 10 | 1 minute |
| `DELETE /webhooks/{id}` | 10 | 1 minute |
| `POST /webhooks/{id}/test` | 10 | 1 minute |

### Merchant Endpoints

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /merchant/profile` | 300 | 1 minute |
| `PUT /merchant/profile` | 10 | 1 minute |
| `POST /merchant/api-keys` | 10 | 1 minute |
| `GET /merchant/api-keys` | 300 | 1 minute |
| `DELETE /merchant/api-keys/{id}` | 10 | 1 minute |

---

## Rate Limit Exceeded Response

When you exceed a rate limit, the API returns `429 Too Many Requests`:

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

The response headers still include rate limit information:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1742385600
Retry-After: 30
```

---

## Handling Rate Limits

### Check headers proactively

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);

  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const resetTime = parseInt(response.headers.get('X-RateLimit-Reset'));

  if (remaining < 10) {
    console.warn(`Rate limit low: ${remaining} requests remaining. Resets at ${new Date(resetTime * 1000)}`);
  }

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'));
    console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeRequest(url, options); // Retry once
  }

  return response;
}
```

### Implement exponential backoff

```python
import time
import requests

def make_request_with_backoff(url, headers, max_retries=3):
    for attempt in range(max_retries + 1):
        response = requests.get(url, headers=headers)

        if response.status_code != 429:
            return response

        retry_after = int(response.headers.get('Retry-After', 30))
        backoff = min(retry_after * (2 ** attempt), 300)  # Cap at 5 minutes
        print(f"Rate limited. Waiting {backoff}s before retry {attempt + 1}...")
        time.sleep(backoff)

    raise Exception("Max retries exceeded due to rate limiting")
```

---

## Best Practices

1. **Cache responses.** Store wallet balances and payment details locally instead of polling the API repeatedly.
2. **Use webhooks.** Instead of polling for payment status changes, register a webhook and let MyCryptoCoin push updates to you.
3. **Batch where possible.** Retrieve multiple payments with a single list request using filters instead of fetching each one individually.
4. **Monitor your usage.** Track the `X-RateLimit-Remaining` header to avoid hitting limits.
5. **Use exponential backoff.** When retrying after a 429, increase the delay with each attempt.
6. **Spread requests over time.** If creating multiple payments, space them out rather than sending them all at once.

---

## Higher Limits

If you consistently need higher rate limits for your use case, contact us:

- **Email:** developers@mycrypto.co.in
- **WhatsApp:** +91-9876543210

Include your merchant ID and a description of your integration pattern. Higher limits are available for verified high-volume merchants.
