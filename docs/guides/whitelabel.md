# White-Label Customization

Customize the look and feel of your MyCryptoCoin checkout pages, invoices, and emails to match your brand. Includes custom colors, logos, domains, and CSS injection.

---

## What You Can Customize

| Feature | Description | Plan |
|---------|-------------|------|
| Logo | Your logo on checkout pages and invoices | All plans |
| Colors | Primary, secondary, and accent colors | All plans |
| Company name | Shown on checkout and emails | All plans |
| Favicon | Browser tab icon on checkout pages | All plans |
| Support email | Shown on checkout for customer support | All plans |
| Terms/Privacy URLs | Links shown on checkout pages | All plans |
| Custom CSS | Inject custom CSS into checkout pages | Premium |
| Custom domain | Use your own domain (e.g., pay.yourdomain.com) | Premium |
| Remove branding | Remove "Powered by MyCryptoCoin" | Premium |
| Custom email sender | Send invoices from your own email address | Premium |

---

## Get Current Configuration

```bash
curl https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

---

## Update Configuration

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "logoUrl": "https://yoursite.com/logo.png",
    "primaryColor": "#6366f1",
    "secondaryColor": "#1e1b4b",
    "accentColor": "#22d3ee",
    "companyName": "Acme Digital",
    "supportEmail": "help@acmedigital.com",
    "termsUrl": "https://acmedigital.com/terms",
    "privacyUrl": "https://acmedigital.com/privacy",
    "faviconUrl": "https://acmedigital.com/favicon.ico"
  }'
```

### Color Format

All color fields accept hex color codes:
- 3-digit: `#f0f`
- 6-digit: `#6366f1`
- 8-digit (with alpha): `#6366f1cc`

---

## Custom Domain Setup

Use your own domain for checkout pages instead of `mycrypto.co.in/pay/...`.

### Step 1: Set the custom domain

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customDomain": "pay.yourdomain.com"
  }'
```

### Step 2: Add a CNAME record

In your DNS provider, add a CNAME record:

```
pay.yourdomain.com  CNAME  checkout.mycrypto.co.in
```

### Step 3: Verify the domain

After DNS propagation (usually 5-30 minutes):

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/whitelabel/verify-domain \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

If successful:

```json
{
  "success": true,
  "data": {
    "domain": "pay.yourdomain.com",
    "verified": true,
    "sslProvisioned": true
  }
}
```

Once verified, your checkout URLs become `https://pay.yourdomain.com/cs_...` instead of `https://mycrypto.co.in/pay/cs_...`.

---

## Custom CSS

Inject custom CSS into the checkout page for advanced styling:

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customCss": ".checkout-container { border-radius: 16px; } .payment-amount { font-size: 2rem; font-weight: 700; }"
  }'
```

Custom CSS is sanitized to prevent XSS. JavaScript injection is blocked.

---

## Remove MyCryptoCoin Branding

Hide the "Powered by MyCryptoCoin" footer on checkout pages:

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "removeBranding": true
  }'
```

This is a premium feature. Contact sales@mycrypto.co.in for pricing.

---

## Custom Email Sender

Send invoice emails from your own email address instead of noreply@mycrypto.co.in:

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/whitelabel \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customSenderName": "Acme Digital Billing",
    "customSenderEmail": "billing@acmedigital.com"
  }'
```

You will need to verify domain ownership via DNS (SPF/DKIM records) before custom sender email is activated.
