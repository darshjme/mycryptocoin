# Getting Started with MyCryptoCoin

## 1. Create an Account

Sign up at [dashboard.mycrypto.co.in/register](https://dashboard.mycrypto.co.in/register).

## 2. Generate an API Key

Navigate to Settings > API Keys in your dashboard and create a new key.

## 3. Create Your First Payment

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments \
  -H "X-API-Key: mcc_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "BITCOIN",
    "token": "BTC",
    "amount": "25.00",
    "currency": "USD"
  }'
```

## 4. Set Up Webhooks

Register a webhook endpoint to receive real-time payment notifications.

## 5. Go Live

Once testing is complete, switch to production API keys and start accepting payments.
