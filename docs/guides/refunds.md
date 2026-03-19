# Refunds

Refund completed payments to customers, either fully or partially. Supports refunding in the original cryptocurrency or in USDT.

---

## How Refunds Work

1. You initiate a refund via the API for a `confirmed` or `settled` payment
2. MyCryptoCoin deducts the refund amount from your wallet
3. The refund is sent on-chain to the customer's address
4. A `refund.completed` webhook is sent when the transaction confirms
5. The original payment status changes to `refunded` (full) or remains `settled` (partial)

---

## Initiate a Refund

### Full Refund

Omit the `amount` field to refund the entire payment:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/refund \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

### Partial Refund

Specify the amount to refund only a portion:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/refund \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "50.00",
    "reason": "Partial order cancellation"
  }'
```

### Refund in USDT

If the original payment was in BTC or ETH and you want to refund in USDT instead:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/refund \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "99.99",
    "reason": "Product return",
    "refundInUsdt": true
  }'
```

### Custom Destination Address

By default, refunds go to the original sender address. To specify a different address:

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/refund \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Refund to customer wallet",
    "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
  }'
```

---

## Refund Response

```json
{
  "success": true,
  "data": {
    "id": "ref_q1w2e3r4t5",
    "paymentId": "pay_1a2b3c4d5e6f",
    "merchantId": "mch_a1b2c3d4e5f6",
    "amount": "99.99",
    "currency": "USD",
    "network": "ethereum",
    "token": "USDT",
    "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "txHash": null,
    "reason": "Customer requested cancellation",
    "status": "PENDING",
    "isPartial": false,
    "processedAt": null,
    "createdAt": "2026-03-19T12:00:00Z"
  }
}
```

---

## Refund Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Refund initiated, queued for processing |
| `PROCESSING` | Transaction submitted to the blockchain |
| `COMPLETED` | Refund confirmed on-chain |
| `FAILED` | Refund failed (insufficient balance, invalid address, etc.) |

---

## List Refunds

```bash
curl "https://api.mycrypto.co.in/api/v1/refunds?status=COMPLETED&page=1&limit=20" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Filters

| Parameter | Description |
|-----------|-------------|
| `paymentId` | Filter by original payment ID |
| `status` | PENDING, PROCESSING, COMPLETED, FAILED |
| `page` | Page number (default: 1) |
| `limit` | Items per page (max: 100) |

---

## Get Refund Details

```bash
curl https://api.mycrypto.co.in/api/v1/refunds/ref_q1w2e3r4t5 \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

---

## Requirements

- The original payment must be in `confirmed` or `settled` status
- Your wallet must have sufficient balance to cover the refund amount
- Network fees for the refund transaction are deducted from your wallet (not from the refund amount)
- Each payment can be refunded only once (full) or multiple times (partial, up to the original amount)

---

## Webhook Events

| Event | When |
|-------|------|
| `refund.initiated` | Refund is created and queued |
| `refund.completed` | Refund transaction confirmed on-chain |
| `refund.failed` | Refund transaction failed |
