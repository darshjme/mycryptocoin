# Wallets API

View your cryptocurrency balances and configure automatic withdrawals.

---

## List All Wallets

Retrieve balances for all supported cryptocurrencies in your account.

```
GET /wallets
```

### Example Request

```bash
curl https://api.mycrypto.co.in/v1/wallets \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

```json
{
  "data": [
    {
      "crypto": "BTC",
      "name": "Bitcoin",
      "balance": "0.05432100",
      "pending_balance": "0.00100000",
      "balance_usd": "3521.86",
      "deposit_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "network": "bitcoin",
      "auto_withdraw": {
        "enabled": false,
        "address": null,
        "threshold": null
      },
      "updated_at": "2026-03-19T10:30:00Z"
    },
    {
      "crypto": "ETH",
      "name": "Ethereum",
      "balance": "1.25000000",
      "pending_balance": "0.00000000",
      "balance_usd": "4375.00",
      "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      "network": "ethereum",
      "auto_withdraw": {
        "enabled": true,
        "address": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        "threshold": "1.00000000"
      },
      "updated_at": "2026-03-19T10:30:00Z"
    },
    {
      "crypto": "USDT",
      "name": "Tether",
      "balance": "12450.500000",
      "pending_balance": "99.990000",
      "balance_usd": "12450.50",
      "deposit_address": "0x8Fc3c9D89c5F4f2e12B1b5c3D4e5F6a7B8c9D0e1",
      "network": "ethereum",
      "auto_withdraw": {
        "enabled": false,
        "address": null,
        "threshold": null
      },
      "updated_at": "2026-03-19T10:45:30Z"
    }
  ]
}
```

---

## Get Specific Wallet

Retrieve balance and details for a single cryptocurrency.

```
GET /wallets/{crypto}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `crypto` | string | Cryptocurrency symbol (e.g., `BTC`, `ETH`, `USDT`) |

### Example Request

```bash
curl https://api.mycrypto.co.in/v1/wallets/BTC \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

```json
{
  "crypto": "BTC",
  "name": "Bitcoin",
  "balance": "0.05432100",
  "pending_balance": "0.00100000",
  "balance_usd": "3521.86",
  "deposit_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "network": "bitcoin",
  "auto_withdraw": {
    "enabled": false,
    "address": null,
    "threshold": null
  },
  "updated_at": "2026-03-19T10:30:00Z"
}
```

---

## Configure Auto-Withdrawal

Set up automatic withdrawal to an external wallet when your balance exceeds a threshold. Funds are automatically sent to your specified address whenever the balance goes above the threshold.

```
PUT /wallets/{crypto}/auto-withdraw
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `crypto` | string | Cryptocurrency symbol |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | Yes | Enable or disable auto-withdrawal |
| `address` | string | When enabling | Destination wallet address |
| `threshold` | string | When enabling | Trigger threshold in crypto units |

### Enable Auto-Withdrawal

```bash
curl -X PUT https://api.mycrypto.co.in/v1/wallets/BTC/auto-withdraw \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "threshold": "0.01000000"
  }'
```

### Example Response (200 OK)

```json
{
  "crypto": "BTC",
  "auto_withdraw": {
    "enabled": true,
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "threshold": "0.01000000"
  },
  "message": "Auto-withdrawal configured successfully."
}
```

### Disable Auto-Withdrawal

```bash
curl -X PUT https://api.mycrypto.co.in/v1/wallets/ETH/auto-withdraw \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

---

## Wallet Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `crypto` | string | Cryptocurrency symbol |
| `name` | string | Full name of the cryptocurrency |
| `balance` | string | Available balance (confirmed funds) |
| `pending_balance` | string | Balance waiting for confirmations |
| `balance_usd` | string | Approximate USD equivalent |
| `deposit_address` | string | Your deposit address for this crypto |
| `network` | string | Default blockchain network |
| `auto_withdraw` | object | Auto-withdrawal configuration |
| `auto_withdraw.enabled` | boolean | Whether auto-withdrawal is active |
| `auto_withdraw.address` | string/null | Destination address |
| `auto_withdraw.threshold` | string/null | Balance threshold to trigger withdrawal |
| `updated_at` | string | Last balance update timestamp |

---

## How Auto-Withdrawal Works

1. After each settled payment, MyCryptoCoin checks your wallet balance
2. If the balance exceeds the configured `threshold`, a withdrawal is automatically triggered
3. The **entire available balance** (minus network fees) is sent to your configured address
4. You receive a `withdrawal.completed` webhook notification
5. Network fees are deducted from the withdrawal amount

### Important Notes

- Auto-withdrawal address is validated against the blockchain network on configuration
- If an auto-withdrawal fails (e.g., network congestion), it retries after 10 minutes (up to 3 attempts)
- Failed auto-withdrawals trigger a `withdrawal.failed` webhook
- You can still perform manual withdrawals while auto-withdrawal is enabled
- Changing the address requires re-verification via WhatsApp OTP for security

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_address` | Destination address is not valid for this crypto |
| 400 | `invalid_threshold` | Threshold is below the minimum withdrawal amount |
| 401 | `authentication_required` | Missing authentication |
| 404 | `not_found` | Cryptocurrency not supported |
| 500 | `internal_error` | Server error |
