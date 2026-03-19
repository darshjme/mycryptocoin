# Exchange Rates API

Public API endpoints for retrieving real-time cryptocurrency exchange rates. No authentication required.

---

## Get All Rates

```bash
curl https://api.mycrypto.co.in/api/v1/rates
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "crypto": "BITCOIN:BTC",
      "network": "BITCOIN",
      "token": "BTC",
      "name": "Bitcoin",
      "usdRate": 64821.50,
      "usdtRate": 64821.50,
      "btcRate": 1.0,
      "change24h": 2.34,
      "lastUpdated": "2026-03-19T10:30:00Z"
    },
    {
      "crypto": "ETHEREUM:ETH",
      "network": "ETHEREUM",
      "token": "ETH",
      "name": "Ethereum",
      "usdRate": 3521.86,
      "usdtRate": 3521.86,
      "btcRate": 0.0543,
      "change24h": -1.12,
      "lastUpdated": "2026-03-19T10:30:00Z"
    }
  ],
  "meta": {
    "count": 25,
    "cacheRefreshSeconds": 60
  }
}
```

---

## Get Specific Rate

Query by token symbol, `network:token` pair, or name:

```bash
# By token symbol
curl https://api.mycrypto.co.in/api/v1/rates/BTC

# By network:token
curl https://api.mycrypto.co.in/api/v1/rates/ETHEREUM:ETH

# By name
curl https://api.mycrypto.co.in/api/v1/rates/Bitcoin
```

### Response

```json
{
  "success": true,
  "data": {
    "crypto": "BITCOIN:BTC",
    "network": "BITCOIN",
    "token": "BTC",
    "name": "Bitcoin",
    "usdRate": 64821.50,
    "usdtRate": 64821.50,
    "btcRate": 1.0,
    "change24h": 2.34,
    "lastUpdated": "2026-03-19T10:30:00Z"
  }
}
```

---

## Rate Fields

| Field | Description |
|-------|-------------|
| `usdRate` | Current price in USD |
| `usdtRate` | Current price in USDT (approximately equal to USD) |
| `btcRate` | Current price denominated in BTC |
| `change24h` | 24-hour price change percentage |
| `lastUpdated` | When the rate was last fetched |

---

## Caching

- Rates are refreshed from CoinGecko every **60 seconds**
- If the upstream API is unavailable, stale cached data is returned
- The `meta.cacheRefreshSeconds` field tells you the refresh interval

---

## Use Cases

- **Display prices:** Show customers the current crypto equivalent of their order
- **Rate comparison:** Build a rate ticker or comparison widget
- **Conversion calculator:** Let customers preview conversion amounts before checkout
- **Monitoring:** Track portfolio values or trigger alerts on price movements

---

## No Authentication Required

These endpoints are fully public. No API key or Bearer token needed. Rate limits are applied per IP address.
