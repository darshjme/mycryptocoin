# Security Documentation

MyCryptoCoin is built with security at every layer. This document describes our security architecture and best practices for merchants.

---

## Table of Contents

1. [Data Encryption](#data-encryption)
2. [HD Wallet Architecture](#hd-wallet-architecture)
3. [API Key Security](#api-key-security)
4. [Webhook Signature Verification](#webhook-signature-verification)
5. [Two-Factor Authentication via WhatsApp](#two-factor-authentication-via-whatsapp)
6. [IP Whitelisting](#ip-whitelisting)
7. [Rate Limiting](#rate-limiting)
8. [Audit Logs](#audit-logs)
9. [Best Practices for Merchants](#best-practices-for-merchants)

---

## Data Encryption

### In Transit

All communication with MyCryptoCoin is encrypted using TLS 1.3 (with TLS 1.2 as fallback). This applies to:

- All API requests and responses
- Webhook deliveries to your endpoints
- Dashboard access
- Hosted checkout pages

We enforce HTTPS for all endpoints. HTTP requests are rejected outright (not redirected).

**TLS Configuration:**
- Protocols: TLS 1.3 preferred, TLS 1.2 minimum
- Cipher suites: Only AEAD ciphers (AES-256-GCM, ChaCha20-Poly1305)
- HSTS enabled with a 1-year max-age and includeSubDomains
- Certificate transparency logging enabled
- OCSP stapling enabled

### At Rest

All sensitive data stored in our databases is encrypted at rest:

| Data | Encryption |
|------|-----------|
| API keys | AES-256-GCM with per-key envelope encryption |
| Webhook secrets | AES-256-GCM |
| Merchant passwords | bcrypt with cost factor 12 (never stored in plaintext) |
| Private keys (HD wallets) | AES-256-GCM with HSM-protected master keys |
| Personal information | AES-256-GCM with field-level encryption |
| Database backups | AES-256 encrypted at the storage layer |

Encryption keys are managed through a Hardware Security Module (HSM) with automatic key rotation every 90 days.

---

## HD Wallet Architecture

MyCryptoCoin uses Hierarchical Deterministic (HD) wallets based on BIP-32, BIP-39, and BIP-44 standards to manage merchant funds.

### How It Works

1. **Master seed generation:** A cryptographically secure master seed is generated within an HSM (Hardware Security Module)
2. **Merchant key derivation:** Each merchant receives a unique derived key path, isolating their funds
3. **Payment address generation:** Every payment gets a unique deposit address derived from the merchant's HD path
4. **No address reuse:** Each payment uses a fresh address, improving privacy and auditability

### Key Hierarchy

```
Master Seed (HSM-protected)
  |
  +-- Merchant A (m/44'/0'/0')
  |     +-- Payment 1 (m/44'/0'/0'/0/0)
  |     +-- Payment 2 (m/44'/0'/0'/0/1)
  |     +-- Payment 3 (m/44'/0'/0'/0/2)
  |
  +-- Merchant B (m/44'/0'/1')
        +-- Payment 1 (m/44'/0'/1'/0/0)
        +-- Payment 2 (m/44'/0'/1'/0/1)
```

### Private Key Protection

- Master seeds never leave the HSM
- Private keys for signing transactions are derived in memory and immediately discarded after use
- No private keys are stored in the application database
- Hot wallet contains only operational funds; the majority of assets are in cold storage
- Multi-signature (2-of-3) required for cold storage withdrawals

### Cold/Hot Wallet Split

| Wallet | Purpose | Percentage of Funds |
|--------|---------|-------------------|
| Hot wallet | Processes day-to-day withdrawals | ~5-10% of total funds |
| Warm wallet | Replenishes hot wallet as needed | ~15-20% |
| Cold storage | Long-term secure storage | ~70-80% |

Funds are automatically rebalanced between wallets. If the hot wallet drops below its threshold, funds are moved from the warm wallet (automated, multi-sig authorized).

---

## API Key Security

### Key Generation

API keys are generated using a cryptographically secure random number generator (CSPRNG):
- 256 bits of entropy
- Prefixed with `mcc_live_` or `mcc_test_` for identification
- Hashed (SHA-256) before storage -- the full key is never stored

### Key Storage

When a merchant generates an API key:
1. The full key is shown to the merchant once
2. A SHA-256 hash of the key is stored in the database
3. The first 12 characters (prefix) are stored in plaintext for identification
4. On every API request, the provided key is hashed and compared to the stored hash

This means even if the database is compromised, API keys cannot be recovered.

### Key Scoping

Each API key can be scoped to specific permissions:
- **Read-only keys** for monitoring dashboards
- **Write-only keys** for payment creation
- **Full-access keys** for complete integration

Principle of least privilege: each key should have only the permissions it needs.

### Key Lifecycle

| Action | Description |
|--------|-------------|
| Generation | Merchant generates key via dashboard or API |
| Usage | Key is included in API requests via X-API-Key header |
| Rotation | Merchant generates a new key and revokes the old one |
| Revocation | Immediate effect, all requests with the key fail instantly |

### Recommendations

- Rotate API keys every 90 days
- Use separate keys for different services
- Never commit keys to version control
- Use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Monitor `last_used_at` for unusual activity

---

## Webhook Signature Verification

Every webhook delivery is signed with HMAC-SHA256 to guarantee:

1. **Authenticity** -- The request came from MyCryptoCoin
2. **Integrity** -- The payload was not modified in transit
3. **Freshness** -- The request is recent (not a replay)

### Signature Scheme

```
Signature = HMAC-SHA256(webhook_secret, timestamp + "." + body)
Header: X-MCC-Signature: sha256=<hex_signature>
Header: X-MCC-Timestamp: <unix_timestamp>
```

### Verification Steps

1. Extract `X-MCC-Signature` and `X-MCC-Timestamp` headers
2. Reject if timestamp is more than 5 minutes old (replay protection)
3. Concatenate: `timestamp + "." + raw_body`
4. Compute HMAC-SHA256 with your webhook secret
5. Compare signatures using a constant-time comparison function

### Why Constant-Time Comparison

Standard string comparison (`===` or `==`) can leak timing information. An attacker could measure response times to gradually guess the correct signature. Constant-time comparison functions (like `crypto.timingSafeEqual` in Node.js or `hmac.compare_digest` in Python) always take the same amount of time regardless of where strings differ.

### Webhook Secret Management

- The secret is generated when you create a webhook endpoint
- It is shown only once -- store it securely
- If compromised, delete the webhook and create a new one (generates a new secret)
- Each webhook endpoint has its own secret

---

## Two-Factor Authentication via WhatsApp

MyCryptoCoin uses WhatsApp OTP as a second factor for sensitive operations.

### When OTP is Required

| Action | OTP Required |
|--------|-------------|
| Account registration | Yes (WhatsApp verification) |
| Password reset | Yes |
| Configuring auto-withdrawal address | Yes |
| Manual withdrawal | Yes |
| Changing WhatsApp number | Yes |
| Deleting account | Yes |

### OTP Specifications

| Property | Value |
|----------|-------|
| Length | 6 digits |
| Expiry | 10 minutes |
| Max attempts | 5 (then locked for 30 minutes) |
| Delivery | WhatsApp message |
| Rate limit | Maximum 5 OTPs per hour |

### Why WhatsApp

1. **Ubiquity** -- WhatsApp is widely used, especially in our target markets
2. **Secure delivery** -- End-to-end encrypted
3. **No SIM swap risk** -- Unlike SMS, WhatsApp is tied to both the phone number and the device
4. **Instant delivery** -- No carrier delays

### Security Considerations

- OTPs are single-use and expire after 10 minutes
- After 5 failed attempts, the account is temporarily locked
- OTP requests are rate-limited to prevent abuse
- MyCryptoCoin support will never ask for your OTP

---

## IP Whitelisting

Restrict API access to specific IP addresses or CIDR ranges.

### How to Configure

1. Go to **Dashboard > Settings > Security > IP Whitelist**
2. Add your server IP addresses (IPv4 or IPv6)
3. Supports CIDR notation for ranges (e.g., `203.0.113.0/24`)
4. Click **Save**

Or via API:

```bash
curl -X PUT https://api.mycrypto.co.in/v1/merchant/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_whitelist": ["203.0.113.0/24", "198.51.100.42"]
  }'
```

### Behavior

- When IP whitelisting is enabled, requests from non-whitelisted IPs receive a `403 Forbidden` error
- The whitelist applies to **API key authentication only** (not Bearer token login)
- Dashboard access is not affected by API IP whitelisting
- An empty whitelist means all IPs are allowed (default)

### Recommendations

- Whitelist only your server IPs, not developer machine IPs
- Update the whitelist when you change hosting providers
- Keep at least one backup way to access the API (e.g., Bearer token from dashboard) in case you lock yourself out

---

## Rate Limiting

Rate limiting protects against brute force attacks, abuse, and accidental request floods.

### Implementation

- Rate limits are applied per API key or per IP for unauthenticated endpoints
- Limits use a sliding window algorithm
- Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` are returned on every response
- Exceeding the limit returns `429 Too Many Requests`

### Security-Specific Limits

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| POST /auth/login | 20/minute | Prevent credential brute force |
| POST /auth/register | 5/hour | Prevent mass account creation |
| POST /auth/verify-otp | 10/minute | Prevent OTP brute force |
| POST /auth/forgot-password | 5/hour | Prevent OTP flooding |
| POST /withdrawals | 30/minute | Prevent unauthorized mass withdrawals |

### Automatic Lockout

- 10 consecutive failed login attempts: account locked for 30 minutes
- 5 consecutive failed OTP attempts: OTP locked for 30 minutes
- Persistent abuse: IP temporarily banned (1 hour)

---

## Audit Logs

MyCryptoCoin maintains comprehensive audit logs for all account activity.

### What Is Logged

| Event | Details Recorded |
|-------|-----------------|
| Login (success/failure) | IP, user agent, timestamp, method |
| API key creation | Key prefix, permissions, IP |
| API key revocation | Key prefix, IP |
| Payment creation | Payment ID, amount, crypto, IP |
| Withdrawal request | Withdrawal ID, amount, address, IP |
| Withdrawal approval | Withdrawal ID, OTP verification |
| Profile update | Changed fields, IP |
| Webhook creation/update/deletion | Webhook ID, URL, events |
| Auto-withdrawal config change | Crypto, address, threshold |
| Password change/reset | IP, method |
| OTP verification (success/failure) | IP, attempt count |

### Accessing Audit Logs

1. Go to **Dashboard > Settings > Audit Log**
2. View a chronological list of all security events
3. Filter by event type and date range
4. Export logs for compliance or review

### Retention

- Audit logs are retained for 2 years
- Logs are immutable -- they cannot be modified or deleted
- Available via API for automated monitoring:

```bash
curl "https://api.mycrypto.co.in/v1/merchant/audit-log?date_from=2026-03-01&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices for Merchants

### 1. Secure Your API Keys

- Store API keys in environment variables or a secrets manager
- Never hardcode keys in source code
- Never commit keys to Git repositories (add `.env` to `.gitignore`)
- Use different keys for development and production
- Scope keys to minimum required permissions
- Rotate keys every 90 days

```bash
# Good: Environment variable
export MCC_API_KEY="mcc_live_..."

# Good: Secrets manager
aws secretsmanager get-secret-value --secret-id prod/mycryptocoin/api-key

# Bad: Hardcoded
const API_KEY = "mcc_live_..."; // NEVER DO THIS
```

### 2. Verify Webhook Signatures

Always verify the `X-MCC-Signature` header before processing any webhook event. Never trust webhook data without verification. A malicious actor could send fake webhook requests to your endpoint.

### 3. Use HTTPS Everywhere

- Your API server must use HTTPS
- Your webhook endpoint must use HTTPS
- Never send API keys over unencrypted connections

### 4. Validate Payment Amounts

When receiving a `payment.confirmed` webhook, verify the amount matches what you expected:

```javascript
if (event.type === 'payment.confirmed') {
  const order = await getOrder(event.data.metadata.order_id);
  const expectedAmount = order.total_usd;
  const receivedAmount = parseFloat(event.data.amount);

  if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
    console.error('Amount mismatch!', { expected: expectedAmount, received: receivedAmount });
    await flagForReview(order.id);
    return;
  }

  await fulfillOrder(order.id);
}
```

### 5. Implement Idempotent Webhook Handlers

Process each webhook event exactly once. Use the `X-MCC-Delivery-Id` header to track which events have already been processed.

### 6. Set Up Monitoring

Monitor for:
- Unexpected API key usage (unfamiliar IPs, unusual hours)
- Failed webhook deliveries
- Unexpected withdrawals
- High volumes of failed payments
- Rate limit warnings

### 7. Keep Dependencies Updated

If you use our webhook verification libraries or SDK examples, keep them updated to get security patches.

### 8. Segregate Test and Production

- Use separate API keys for test and production
- Use the sandbox base URL for testing
- Never use test keys in production or live keys in test
- Test and production data are completely isolated

### 9. Secure Your Withdrawal Addresses

- Double-check withdrawal addresses before confirming
- Use the address book feature to save verified addresses
- Enable auto-withdrawal only to addresses you fully control
- For high-value withdrawals, verify the address on multiple devices

### 10. Plan for Incident Response

Prepare for potential security incidents:

1. **API key compromise:** Immediately revoke the key from the dashboard and generate a new one
2. **Suspicious webhook activity:** Check the audit log, verify webhook secret integrity, rotate if needed
3. **Unauthorized withdrawal:** Contact support immediately at security@mycrypto.co.in
4. **Account compromise:** Change password, revoke all API keys, contact support

---

## Compliance and Certifications

- **Data Protection:** GDPR-compliant data handling
- **Infrastructure:** Hosted on SOC 2 Type II certified cloud infrastructure
- **Penetration Testing:** Annual third-party penetration tests
- **Bug Bounty:** Responsible disclosure program for security researchers
- **PCI DSS:** Payment card data is not processed (crypto only), but equivalent controls are applied

---

## Reporting Security Issues

If you discover a security vulnerability in MyCryptoCoin:

1. Email **security@mycrypto.co.in** with details
2. Include steps to reproduce the vulnerability
3. Do not exploit the vulnerability beyond what is necessary to demonstrate it
4. Do not disclose the vulnerability publicly until it has been resolved
5. We will acknowledge your report within 24 hours and provide a timeline for resolution

We appreciate responsible disclosure and may offer rewards for significant findings.

---

## Contact

- **Security Team:** security@mycrypto.co.in
- **General Support:** support@mycrypto.co.in
- **Developer Support:** developers@mycrypto.co.in
- **Status Page:** https://status.mycrypto.co.in
