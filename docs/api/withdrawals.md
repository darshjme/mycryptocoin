# Withdrawals API

Withdraw cryptocurrency from your MyCryptoCoin wallet to any external wallet address.

---

## Create Withdrawal

Initiate a withdrawal of cryptocurrency to an external address. The crypto type is specified in the URL path.

```
POST /wallets/{crypto}/withdraw
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `crypto` | string | Cryptocurrency symbol (BTC, ETH, USDT_ERC20, USDT_TRC20, BNB, SOL, MATIC, LTC, DOGE, XRP) |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address` | string | Yes | Destination wallet address |
| `amount` | string | Yes | Amount to withdraw (as decimal string, must be > 0) |
| `memo` | string | No | Memo/tag (max 200 chars; required for XRP, optional for exchange deposits) |

### Minimum Withdrawal Amounts

| Crypto | Minimum | Network Fee (approx.) |
|--------|---------|----------------------|
| BTC | 0.0001 | 0.00005 BTC |
| ETH | 0.001 | 0.0005 ETH |
| USDT (ERC-20) | 1.00 | 2.50 USDT |
| USDT (TRC-20) | 1.00 | 1.00 USDT |
| USDC (ERC-20) | 1.00 | 2.50 USDC |
| BNB | 0.001 | 0.0005 BNB |
| SOL | 0.01 | 0.000005 SOL |
| MATIC | 1.00 | 0.01 MATIC |
| DOGE | 5.00 | 1.00 DOGE |
| LTC | 0.001 | 0.0001 LTC |
| XRP | 0.10 | 0.0001 XRP |
| ADA | 1.00 | 0.17 ADA |
| DOT | 1.00 | 0.01 DOT |
| AVAX | 0.01 | 0.001 AVAX |
| TRX | 1.00 | 1.00 TRX |
| LINK | 0.10 | 0.005 LINK |
| UNI | 0.10 | 0.005 UNI |
| SHIB | 100000 | 50000 SHIB |
| APE | 1.00 | 0.05 APE |
| ARB | 0.10 | 0.001 ARB |
| OP | 0.10 | 0.001 OP |

> Network fees fluctuate based on blockchain congestion. The values above are approximate. The actual fee is shown in the withdrawal response.

### Example Request -- BTC Withdrawal

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/wallets/BTC/withdraw \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0.05000000",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  }'
```

### Example Request -- USDT on Tron

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/wallets/USDT_TRC20/withdraw \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "500.000000",
    "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9"
  }'
```

### Example Request -- XRP with Memo

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/wallets/XRP/withdraw \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.000000",
    "address": "rN7n3473SaZBCG4dFL83w7p1W9cgZw6w3p",
    "memo": "1234567890"
  }'
```

> **Note:** The cryptocurrency is specified in the URL path, not the request body. Use `USDT_ERC20` or `USDT_TRC20` to specify the network for USDT.

### Example Response (201 Created)

```json
{
  "id": "wth_9z8y7x6w5v",
  "merchant_id": "mch_a1b2c3d4e5f6",
  "status": "pending",
  "crypto": "BTC",
  "amount": "0.05000000",
  "network_fee": "0.00005000",
  "net_amount": "0.04995000",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "network": "bitcoin",
  "tx_hash": null,
  "memo": null,
  "created_at": "2026-03-19T10:30:00Z",
  "completed_at": null
}
```

### Withdrawal Status Flow

```
pending --> processing --> completed
                |
                +--> failed
                |
                +--> cancelled
```

| Status | Description |
|--------|-------------|
| `pending` | Withdrawal request received, awaiting processing |
| `processing` | Transaction submitted to the blockchain |
| `completed` | Transaction confirmed on-chain |
| `failed` | Withdrawal failed (network error, invalid address) |
| `cancelled` | Withdrawal cancelled before processing |

---

## List Withdrawals

To list withdrawals, use the unified transactions endpoint:

```
GET /transactions
```

Filter by transaction type to see only withdrawals. See the [Transactions](#) documentation for full query parameters.

### Example Request

```bash
curl "https://api.mycrypto.co.in/api/v1/transactions" \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

```json
{
  "data": [
    {
      "id": "wth_9z8y7x6w5v",
      "merchant_id": "mch_a1b2c3d4e5f6",
      "status": "completed",
      "crypto": "BTC",
      "amount": "0.05000000",
      "network_fee": "0.00005000",
      "net_amount": "0.04995000",
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "network": "bitcoin",
      "tx_hash": "b6f6991d28426181ec42cdd17b5e37e4b21e58ee63aef0e6f1c2c6e5f3b2a1d0",
      "memo": null,
      "created_at": "2026-03-19T10:30:00Z",
      "completed_at": "2026-03-19T10:35:00Z"
    }
  ],
  "pagination": {
    "total": 23,
    "page": 1,
    "limit": 5,
    "pages": 5
  }
}
```

---

## Get Withdrawal Details

Retrieve full details of a specific withdrawal.

```
GET /withdrawals/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Withdrawal ID (e.g., `wth_9z8y7x6w5v`) |

### Example Request

```bash
curl https://api.mycrypto.co.in/api/v1/wallets/wth_9z8y7x6w5v \
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Example Response (200 OK)

Returns the full Withdrawal object (same structure as create response with `status`, `tx_hash`, and `completed_at` populated).

---

## Withdrawal Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique withdrawal identifier (prefix: `wth_`) |
| `merchant_id` | string | Your merchant ID |
| `status` | string | Current withdrawal status |
| `crypto` | string | Cryptocurrency withdrawn |
| `amount` | string | Gross withdrawal amount |
| `network_fee` | string | Blockchain network fee deducted |
| `net_amount` | string | Amount received at destination (amount - network_fee) |
| `address` | string | Destination wallet address |
| `network` | string | Blockchain network used |
| `tx_hash` | string/null | On-chain transaction hash (null until processing) |
| `memo` | string/null | Memo/tag if provided |
| `created_at` | string | When withdrawal was requested |
| `completed_at` | string/null | When withdrawal was completed on-chain |

---

## Address Validation

MyCryptoCoin validates destination addresses before processing:

| Network | Validation |
|---------|-----------|
| Bitcoin | Bech32 (bc1...), P2SH (3...), Legacy (1...) |
| Ethereum / ERC-20 | EIP-55 checksum (0x...) |
| Tron / TRC-20 | Base58 (T...) |
| Solana | Base58, 32-44 characters |
| XRP | Classic address (r...) with optional memo |
| BNB Smart Chain | EIP-55 checksum (0x...) |
| Polygon | EIP-55 checksum (0x...) |
| Litecoin | Bech32 (ltc1...), P2SH (M...), Legacy (L...) |
| Dogecoin | Base58 (D...) |

If the address fails validation, you receive a `400` error:

```json
{
  "error": {
    "code": "invalid_address",
    "message": "The provided address is not a valid Bitcoin address.",
    "details": {
      "address": "invalid_address_here",
      "network": "bitcoin"
    }
  }
}
```

---

## Multi-Network Tokens

Some tokens exist on multiple networks. You must specify the `network` parameter for these tokens:

| Token | Available Networks |
|-------|-------------------|
| USDT | ethereum, tron, bsc, polygon |
| USDC | ethereum, polygon, solana, arbitrum |

If you omit `network` for a multi-network token, the API returns an error:

```json
{
  "error": {
    "code": "network_required",
    "message": "USDT exists on multiple networks. Please specify the 'network' parameter.",
    "details": {
      "available_networks": ["ethereum", "tron", "bsc", "polygon"]
    }
  }
}
```

---

## Processing Times

| Network | Typical Processing Time |
|---------|------------------------|
| Bitcoin | 10-30 minutes |
| Ethereum | 2-5 minutes |
| Tron | 1-3 minutes |
| Solana | 30 seconds - 2 minutes |
| BNB Smart Chain | 1-3 minutes |
| Polygon | 2-5 minutes |
| XRP | 5-10 seconds |
| Litecoin | 5-15 minutes |
| Dogecoin | 10-30 minutes |
| Arbitrum | 1-3 minutes |
| Optimism | 1-3 minutes |

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | Missing or invalid fields |
| 400 | `invalid_address` | Destination address is invalid |
| 400 | `network_required` | Network must be specified for multi-network tokens |
| 400 | `invalid_network` | Specified network is not valid for this token |
| 400 | `insufficient_balance` | Wallet balance too low |
| 400 | `below_minimum` | Amount is below minimum withdrawal |
| 400 | `memo_required` | Memo is required for this crypto (XRP) |
| 401 | `authentication_required` | Missing authentication |
| 404 | `not_found` | Withdrawal ID does not exist |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Server error |

---

## Webhook Events

Withdrawals trigger these webhook events:

| Event | When |
|-------|------|
| `withdrawal.initiated` | Withdrawal request submitted for processing |
| `withdrawal.completed` | Transaction confirmed on-chain |
| `withdrawal.failed` | Transaction failed |

See the [Webhooks Guide](webhooks.md) for payload format and handling.
