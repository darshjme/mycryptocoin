# Authentication

MyCryptoCoin supports two authentication methods. Choose the right one based on your use case.

---

## Authentication Methods

### 1. API Key Authentication

**Best for:** Server-to-server integrations, backend services, automated systems.

API keys are long-lived credentials that identify your merchant account. Pass the key in the `X-API-Key` header with every request.

```bash
curl https://api.mycrypto.co.in/api/v1/payments \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json"
```

#### Key Prefixes

| Prefix | Environment | Description |
|--------|-------------|-------------|
| `mcc_live_` | Production | Processes real transactions on mainnet |
| `mcc_test_` | Sandbox | Test transactions only, no real funds |

#### Generating API Keys

1. Log in to the [MyCryptoCoin Dashboard](https://dashboard.mycrypto.co.in)
2. Navigate to **Settings > API Keys**
3. Click **Generate New Key**
4. Select the mode (`live` or `test`) and permissions
5. Copy and store the key immediately -- it is shown only once

Or via API (requires Bearer token authentication):

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/merchant/api-keys \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "mode": "live",
    "permissions": ["payments:read", "payments:write", "wallets:read"]
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "key_p1q2r3s4t5",
    "name": "Production Server",
    "key": "mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "prefix": "mcc_live_a1b2",
    "mode": "live",
    "permissions": ["payments:read", "payments:write", "wallets:read"],
    "lastUsedAt": null,
    "createdAt": "2026-03-19T10:30:00Z"
  }
}
```

> **Note:** The actual permissions accepted by the API are: `payments:read`, `payments:write`, `wallets:read`, `wallets:write`, `transactions:read`, `webhooks:manage`.

> **Warning:** The full `key` value is returned only once at creation time. Store it securely. If you lose it, revoke the key and generate a new one.

#### API Key Permissions

Scope API keys to the minimum required permissions:

| Permission | Description |
|------------|-------------|
| `payments:read` | List and view payments |
| `payments:write` | Create payments, verify payments |
| `wallets:read` | View wallet balances |
| `wallets:write` | Configure auto-withdrawal, create withdrawals |
| `transactions:read` | List transactions |
| `webhooks:manage` | Create, update, delete webhooks |

#### Revoking API Keys

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/merchant/api-keys/key_p1q2r3s4t5 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

Revocation is immediate. Any in-flight requests using the revoked key will fail.

---

### 2. Bearer Token Authentication

**Best for:** Dashboard sessions, mobile apps, frontend integrations where the user logs in.

Bearer tokens are short-lived JWTs obtained through the login flow. Pass the token in the `Authorization` header.

```bash
curl https://api.mycrypto.co.in/v1/payments \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Token Lifecycle

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 24 hours | Authenticates API requests |
| Refresh Token | 30 days | Obtains new access tokens without re-login |

#### Login Flow

**Step 1: Register (first time only)**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "email": "merchant@example.com",
    "password": "SecurePass123",
    "business_name": "Acme Digital Services",
    "business_type": "private_limited"
  }'
```

**Step 2: Verify WhatsApp OTP**

A 6-digit OTP is sent to the provided WhatsApp number. Submit it:

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "otp": "482916"
  }'
```

Response includes access and refresh tokens:

```json
{
  "verified": true,
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "mcc_rt_x7k9m2p4q8...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "message": "WhatsApp number verified successfully."
}
```

**Step 3: Login (subsequent times)**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "password": "SecurePass123"
  }'
```

Or with email:

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "merchant@example.com",
    "password": "SecurePass123"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "mcc_rt_x7k9m2p4q8...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "merchant": {
    "id": "mch_a1b2c3d4e5f6",
    "business_name": "Acme Digital Services",
    "status": "active"
  }
}
```

**Step 4: Refresh token before expiry**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "mcc_rt_x7k9m2p4q8..."
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "mcc_rt_n3w7t0k3n...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

> **Note:** Refresh token rotation is enabled. Each refresh returns a new refresh token and invalidates the old one. If a refresh token is used twice, all tokens for the account are revoked (replay detection).

---

## Password Recovery

**Step 1: Request reset OTP**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210"
  }'
```

**Step 2: Reset with OTP**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "otp": "482916",
    "new_password": "NewSecurePass456"
  }'
```

---

## When to Use Which

| Scenario | Method | Why |
|----------|--------|-----|
| E-commerce backend creating payments | API Key | Long-lived, no refresh needed |
| Webhook endpoint processing events | API Key | Server-to-server, no user session |
| Dashboard frontend (React, Vue) | Bearer Token | User login session, short-lived |
| Mobile app | Bearer Token | User-specific session |
| WordPress plugin | API Key | Stored in plugin settings |
| Cron job checking balances | API Key | Automated, no user interaction |

---

## Security Best Practices

1. **Never expose live API keys in client-side code.** Use them only on your server.
2. **Use test keys during development.** Switch to live keys only in production.
3. **Scope API keys to minimum permissions.** A key that only creates payments should not have withdrawal permissions.
4. **Rotate API keys periodically.** Generate new keys and revoke old ones every 90 days.
5. **Store keys in environment variables.** Never commit them to version control.
6. **Enable IP whitelisting** to restrict API key usage to known server IPs.
7. **Monitor the `last_used_at` field** on your API keys. Unexpected activity may indicate compromise.

```bash
# Good: Environment variable
export MCC_API_KEY="mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# Bad: Hardcoded in source
const apiKey = "mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"; // DON'T DO THIS
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 401 | `authentication_required` | No API key or Bearer token provided |
| 401 | `invalid_api_key` | API key is invalid or has been revoked |
| 401 | `token_expired` | Bearer token has expired, use refresh |
| 401 | `invalid_token` | Bearer token is malformed |
| 403 | `forbidden` | API key lacks required permissions |
| 403 | `account_suspended` | Merchant account is suspended |
| 403 | `ip_not_whitelisted` | Request IP not in whitelist |
