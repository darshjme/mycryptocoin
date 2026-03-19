# Discount Codes

Create and manage discount codes (coupons) for your checkout sessions. Supports percentage and fixed-amount discounts with usage limits, expiry dates, and per-customer restrictions.

---

## Create a Discount Code

### Percentage Discount

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/discounts \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER25",
    "type": "PERCENTAGE",
    "value": "25",
    "maxUses": 100,
    "perCustomerLimit": 1,
    "minOrderAmount": "50.00",
    "expiresAt": "2026-09-01T00:00:00Z"
  }'
```

### Fixed Amount Discount

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/discounts \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE10",
    "type": "FIXED",
    "value": "10.00",
    "maxUses": 500,
    "minOrderAmount": "25.00"
  }'
```

### Auto-Generated Code

Omit the `code` field and one is generated automatically:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/discounts \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PERCENTAGE",
    "value": "15"
  }'
```

Response includes the generated code (e.g., `"code": "A3F2B1C9"`).

---

## Discount Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | No | Custom code (auto-generated if omitted) |
| `type` | string | Yes | `PERCENTAGE` or `FIXED` |
| `value` | string | Yes | Discount value (e.g., "25" for 25% or "10.00" for $10) |
| `maxUses` | integer | No | Total uses allowed across all customers |
| `perCustomerLimit` | integer | No | Maximum uses per unique customer email |
| `minOrderAmount` | string | No | Minimum order amount for the code to apply |
| `applicableCheckoutIds` | array | No | Restrict to specific checkout sessions |
| `expiresAt` | string | No | ISO 8601 expiry date |

---

## Validate a Discount Code

Check if a code is valid before creating a checkout session:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/discounts/validate \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER25",
    "amount": "99.99",
    "customerEmail": "buyer@example.com"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": "25.00",
    "finalAmount": "74.99",
    "message": null
  }
}
```

If the code is invalid:

```json
{
  "success": true,
  "data": {
    "valid": false,
    "discountAmount": "0",
    "finalAmount": "99.99",
    "message": "Discount code has expired"
  }
}
```

---

## Using Discounts with Checkout Sessions

Pass the `discountCode` when creating a checkout session:

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

The checkout session will show both the original and discounted amounts.

---

## List Discount Codes

```bash
curl "https://api.mycrypto.co.in/api/v1/discounts?isActive=true&page=1&limit=20" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

---

## Get Discount Details

```bash
curl https://api.mycrypto.co.in/api/v1/discounts/disc_a1b2c3 \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

Response includes `usedCount` so you can track redemption progress.

---

## Deactivate a Discount Code

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/discounts/disc_a1b2c3 \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

Deactivated codes immediately stop working. Existing checkout sessions that already applied the discount are not affected.
