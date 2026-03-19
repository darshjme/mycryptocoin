# Error Reference

All MyCryptoCoin API errors follow a consistent JSON structure.

---

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "amount",
        "message": "Amount must be a valid decimal number"
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code (UPPER_CASE) for programmatic handling |
| `error.message` | string | Human-readable description suitable for logging |
| `error.details` | object/array | Additional context (optional, varies by error type) |

---

## HTTP Status Codes

| Status | Meaning | When It Happens |
|--------|---------|-----------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created (payment, withdrawal, webhook, API key) |
| 400 | Bad Request | Invalid or missing request parameters |
| 401 | Unauthorized | Missing, invalid, or expired authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists (e.g., duplicate registration) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## Error Codes -- Complete Reference

The backend uses the following error classes, each with a specific `code` and default HTTP status:

### Authentication Errors (AUTH_ERROR -- 401)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `AUTH_ERROR` | 401 | Authentication failed | Provide a valid API key or Bearer token |
| `AUTH_ERROR` | 401 | No authentication token provided | Include an `Authorization` or `X-API-Key` header |
| `AUTH_ERROR` | 401 | Token has expired | Use `/auth/refresh-token` to get a new access token |
| `AUTH_ERROR` | 401 | Invalid token | Ensure the JWT format is correct |
| `AUTH_ERROR` | 401 | No API key provided | Include an `X-API-Key` header |
| `AUTH_ERROR` | 401 | Invalid API key format | API keys must start with `mcc_live_` or `mcc_test_` |
| `AUTH_ERROR` | 401 | Invalid or revoked API key | Check your key; generate a new one if revoked |

### Authorization Errors (FORBIDDEN -- 403)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `FORBIDDEN` | 403 | Access denied | The authenticated user lacks required permissions |
| `FORBIDDEN` | 403 | Admin access required | This endpoint is admin-only |
| `FORBIDDEN` | 403 | Merchant account is deactivated | Contact support |

### Validation Errors (VALIDATION_ERROR -- 400)

| Code | HTTP Status | Message | Resolution |
|------|-------------|---------|------------|
| `VALIDATION_ERROR` | 400 | Request validation failed | Check the `details` array for specific field errors |

Zod validation errors return a `details` array with objects containing `path` (field name) and `message` (validation error):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "email", "message": "Invalid email address" },
      { "path": "password", "message": "Password must be at least 8 characters" }
    ]
  }
}
```

### Payment Errors (PAYMENT_ERROR -- 400)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `PAYMENT_ERROR` | 400 | Payment processing failed | Check the error message for specifics |

### Not Found (NOT_FOUND -- 404)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `NOT_FOUND` | 404 | Resource not found | Verify the ID |
| `ROUTE_NOT_FOUND` | 404 | Route not found: METHOD /path | Check the endpoint URL |

### Conflict (CONFLICT -- 409)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `CONFLICT` | 409 | Resource already exists | The email, phone, or other unique field is already in use |

### Wallet/Withdrawal Errors (WITHDRAWAL_ERROR -- 400)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `WITHDRAWAL_ERROR` | 400 | Withdrawal failed | Check balance, address validity, and minimum amounts |

### Crypto Errors (CRYPTO_ERROR -- 500)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `CRYPTO_ERROR` | 500 | Cryptocurrency operation failed | Retry; if persistent, contact support |

### OTP Errors (OTP_ERROR -- 400)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `OTP_ERROR` | 400 | OTP verification failed | Request a new OTP and try again |

### Webhook Errors (WEBHOOK_ERROR -- 500)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `WEBHOOK_ERROR` | 500 | Webhook delivery failed | Check webhook URL accessibility |

### Rate Limiting (RATE_LIMIT -- 429)

| Code | HTTP Status | Message (default) | Resolution |
|------|-------------|---------|------------|
| `RATE_LIMIT` | 429 | Too many requests | Wait for the `retryAfter` duration (60 seconds) |

### Server Errors (INTERNAL_ERROR -- 500)

| Code | HTTP Status | Message | Resolution |
|------|-------------|---------|------------|
| `INTERNAL_ERROR` | 500 | An unexpected error occurred | Retry; if persistent, contact support with X-Request-Id |

---

## Error Handling Best Practices

### 1. Check the HTTP status code first

```javascript
if (response.status === 401) {
  // Re-authenticate
} else if (response.status === 429) {
  // Back off and retry
} else if (response.status >= 500) {
  // Server issue, retry with backoff
} else if (response.status >= 400) {
  // Client error, check error.code
}
```

### 2. Use the error code for programmatic handling

```javascript
const { code } = error;

switch (code) {
  case 'WITHDRAWAL_ERROR':
    notifyMerchant('Withdrawal failed. Check balance and address.');
    break;
  case 'VALIDATION_ERROR':
    // Show field-level errors from error.details array
    error.details.forEach(d => showFormError(d.path, d.message));
    break;
  case 'RATE_LIMIT':
    await sleep(60 * 1000);
    retry();
    break;
  case 'AUTH_ERROR':
    redirectToLogin();
    break;
  default:
    logError(error);
}
```

### 3. Implement exponential backoff for retries

```javascript
async function requestWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        if (attempt === maxRetries) throw error;
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry client errors
      }
    }
  }
}
```

### 4. Always log the X-Request-Id

When contacting support, include the `X-Request-Id` from the response headers. This allows us to trace the exact request in our systems.

```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const requestId = response.headers.get('X-Request-Id');
    const error = await response.json();
    console.error(`API Error [${requestId}]:`, error);
  }
} catch (err) {
  console.error('Network error:', err);
}
```
