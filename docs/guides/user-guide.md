# MyCryptoCoin Merchant User Guide

A non-technical guide for merchants using MyCryptoCoin to accept cryptocurrency payments.

---

## Table of Contents

1. [Creating Your Account](#creating-your-account)
2. [Dashboard Overview](#dashboard-overview)
3. [Understanding Your Balances](#understanding-your-balances)
4. [Tracking Payments](#tracking-payments)
5. [Setting Up Auto-Withdrawals](#setting-up-auto-withdrawals)
6. [Manual Withdrawals](#manual-withdrawals)
7. [Managing API Keys](#managing-api-keys)
8. [Security Best Practices](#security-best-practices)
9. [Reading Transaction History](#reading-transaction-history)
10. [Understanding Fees](#understanding-fees)
11. [Getting Help](#getting-help)

---

## Creating Your Account

### Step 1: Sign Up

1. Visit [dashboard.mycrypto.co.in](https://dashboard.mycrypto.co.in)
2. Click **Create Account**
3. Enter your details:
   - **WhatsApp Number** (with country code, e.g., +919876543210) -- this is your primary identifier
   - **Email Address** (optional but recommended for notifications)
   - **Password** (minimum 8 characters, must include uppercase, lowercase, and a number)
   - **Business Name** (your registered business name)
   - **Business Type** (individual, sole proprietorship, partnership, private limited, etc.)
4. Click **Register**

### Step 2: Verify Your WhatsApp Number

1. You will receive a 6-digit code on WhatsApp from MyCryptoCoin
2. Enter the code on the verification screen
3. The code expires after 10 minutes -- if it expires, click **Resend OTP**

### Step 3: Complete Your Profile

After verification, complete your merchant profile:
1. Upload your business logo (shown on the checkout page your customers see)
2. Add your website URL
3. Select which cryptocurrencies you want to accept
4. Choose your default fiat currency (USD, EUR, GBP, INR, etc.)

Your account is now active and ready to accept payments.

---

## Dashboard Overview

After logging in, you will see the main dashboard with these sections:

### Top Bar
- **Total Balance** -- Combined USD value of all your crypto wallets
- **Today's Revenue** -- Payments received today
- **Pending Payments** -- Payments waiting for confirmation

### Main Sections

| Section | What It Shows |
|---------|---------------|
| **Overview** | Revenue chart, recent activity, quick stats |
| **Payments** | All incoming payments with status and details |
| **Wallets** | Balances for each cryptocurrency |
| **Withdrawals** | History of money you have sent out |
| **Transactions** | Complete transaction log (payments, withdrawals, fees) |
| **Webhooks** | Technical settings for automated notifications |
| **Settings** | Profile, API keys, security settings |

### Status Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| Yellow | Pending | Waiting for customer to pay |
| Blue | Confirming | Crypto sent, waiting for blockchain confirmations |
| Green | Confirmed / Settled | Payment received and credited to your wallet |
| Red | Failed | Payment failed (underpaid or error) |
| Gray | Expired | Customer did not pay within the time window |

---

## Understanding Your Balances

### Available Balance

This is the confirmed crypto in your wallet that you can withdraw at any time. These funds have been fully confirmed on the blockchain.

### Pending Balance

This is crypto that has been detected on the blockchain but has not yet received enough confirmations. It will move to your available balance once confirmed (typically within minutes).

### Balance in USD

This is an approximate USD value based on current exchange rates. The actual value may differ slightly when you withdraw or convert.

### Where to Find Your Balances

1. **Dashboard > Wallets** -- Shows all cryptocurrencies with balances
2. Click on any cryptocurrency to see:
   - Available balance
   - Pending balance
   - Deposit address (for receiving payments)
   - Auto-withdrawal settings
   - Recent transaction history for that crypto

---

## Tracking Payments

### Viewing Payments

1. Go to **Dashboard > Payments**
2. You will see a list of all payments with:
   - Payment ID
   - Amount (in fiat and crypto)
   - Cryptocurrency used
   - Status
   - Date and time

### Filtering Payments

Use the filters at the top of the payments list:

| Filter | Options |
|--------|---------|
| **Status** | All, Pending, Confirming, Confirmed, Settled, Expired, Failed |
| **Cryptocurrency** | BTC, ETH, USDT, etc. |
| **Date Range** | Custom start and end dates |

### Payment Details

Click on any payment to see full details:

- **Payment ID** -- Unique identifier (e.g., pay_1a2b3c4d5e6f)
- **Status** -- Current status with timestamp
- **Fiat Amount** -- The amount your customer was charged (e.g., $99.99 USD)
- **Crypto Amount** -- The amount in crypto (e.g., 99.99 USDT)
- **Exchange Rate** -- Rate at the time the payment was created
- **Fee** -- MyCryptoCoin fee (0.5%)
- **Net Amount** -- What you received after the fee
- **Deposit Address** -- The unique address generated for this payment
- **Transaction Hash** -- The on-chain transaction ID (click to view on blockchain explorer)
- **Confirmations** -- How many block confirmations have been received
- **Metadata** -- Any custom data your integration attached (e.g., order ID)
- **Timeline** -- Step-by-step history of the payment

### Exporting Payments

1. Go to **Dashboard > Payments**
2. Apply any filters you need
3. Click **Export** in the top-right corner
4. Choose format: CSV or PDF
5. The export will download to your computer

---

## Setting Up Auto-Withdrawals

Auto-withdrawal automatically sends your crypto to your own wallet whenever your balance exceeds a threshold. This keeps your funds under your own control.

### How to Configure

1. Go to **Dashboard > Wallets**
2. Click on the cryptocurrency you want to configure (e.g., BTC)
3. Click **Configure Auto-Withdrawal**
4. Enter:
   - **Destination Address** -- Your external wallet address where you want funds sent
   - **Threshold** -- The balance at which auto-withdrawal triggers (e.g., 0.01 BTC)
   - **Enable** -- Toggle on
5. You will receive a verification OTP on WhatsApp (for security)
6. Enter the OTP to confirm
7. Click **Save**

### How It Works

- After each payment settles, MyCryptoCoin checks your balance
- If the balance exceeds your threshold, the entire available balance is automatically withdrawn
- Network fees are deducted from the withdrawal
- You receive a notification when the withdrawal completes

### Example

If you set the BTC threshold to 0.01 BTC:
- Payment settles, balance is now 0.008 BTC -- no withdrawal triggered
- Another payment settles, balance is now 0.013 BTC -- exceeds threshold
- 0.013 BTC (minus network fee) is automatically sent to your address

---

## Manual Withdrawals

### How to Withdraw

1. Go to **Dashboard > Wallets**
2. Click on the cryptocurrency you want to withdraw
3. Click **Withdraw**
4. Enter:
   - **Amount** -- How much to withdraw (see minimum amounts below)
   - **Destination Address** -- Where to send the crypto
   - **Network** -- For tokens like USDT, choose the network (Ethereum, Tron, etc.)
   - **Memo/Tag** -- Required for XRP and some exchange addresses
5. Review the network fee and net amount
6. Click **Confirm Withdrawal**
7. Enter the WhatsApp OTP for verification
8. The withdrawal is processed (typically within minutes)

### Minimum Withdrawal Amounts

| Cryptocurrency | Minimum |
|----------------|---------|
| BTC | 0.0001 BTC |
| ETH | 0.001 ETH |
| USDT | 1.00 USDT |
| USDC | 1.00 USDC |
| BNB | 0.001 BNB |
| SOL | 0.01 SOL |
| LTC | 0.001 LTC |
| DOGE | 5.00 DOGE |
| XRP | 0.10 XRP |

### Withdrawal Status

| Status | Meaning |
|--------|---------|
| Pending | Request received, queued for processing |
| Processing | Transaction submitted to the blockchain |
| Completed | Transaction confirmed on the blockchain |
| Failed | Something went wrong (you will be notified) |

### Important Notes

- Withdrawals are typically processed within 5-30 minutes depending on the blockchain
- Network fees are deducted from the withdrawal amount
- Double-check the destination address -- crypto transactions cannot be reversed
- For USDT and USDC, make sure you select the correct network (sending to the wrong network may result in lost funds)

---

## Managing API Keys

API keys allow your website or application to communicate with MyCryptoCoin. You need at least one API key to accept payments.

### Creating an API Key

1. Go to **Dashboard > Settings > API Keys**
2. Click **Generate New Key**
3. Enter a name (e.g., "Production Server" or "WordPress Plugin")
4. Select the mode:
   - **Test** -- For development and testing (no real transactions)
   - **Live** -- For production (real transactions)
5. Select permissions (what the key can do)
6. Click **Generate**
7. **Copy the key immediately** -- it is shown only once

### Viewing Your Keys

The API keys list shows:
- Key name
- Key prefix (first 12 characters for identification)
- Mode (test or live)
- Permissions
- Last used date
- Created date

The full key is never shown again after creation.

### Revoking a Key

If you suspect a key has been compromised:
1. Go to **Dashboard > Settings > API Keys**
2. Click the **Revoke** button next to the key
3. Confirm the revocation

Revocation is immediate. Any system using that key will stop working. Generate a new key and update your integration.

### Key Security Tips

- Never share your API key with anyone
- Do not paste API keys in emails, chat, or public forums
- Use test keys during development
- Rotate your keys every 90 days
- If you suspect a key is compromised, revoke it immediately

---

## Security Best Practices

### Protect Your Account

1. **Use a strong password.** At least 8 characters with uppercase, lowercase, and numbers. Use a password manager.

2. **Keep your WhatsApp number secure.** Your WhatsApp number is used for two-factor authentication (OTP). Do not share your WhatsApp OTP with anyone. MyCryptoCoin support will never ask for your OTP.

3. **Enable IP whitelisting.** If your integration runs from specific server IPs, restrict API access to those IPs only:
   - Go to **Settings > Security > IP Whitelist**
   - Add your server IP addresses
   - Only requests from these IPs will be accepted

4. **Review API key permissions.** Give each key only the permissions it needs. A key used only for creating payments does not need withdrawal permissions.

5. **Monitor your activity.** Regularly check:
   - **Payments** for unexpected transactions
   - **API Keys** for unfamiliar last-used dates
   - **Withdrawals** for unauthorized transfers

6. **Rotate API keys regularly.** Generate new keys and revoke old ones every 90 days.

### What MyCryptoCoin Will Never Do

- Ask for your password
- Ask for your WhatsApp OTP
- Ask you to send crypto to an address for "verification"
- Contact you from unofficial numbers or email addresses

If you receive suspicious communications claiming to be from MyCryptoCoin, report them to security@mycrypto.co.in.

---

## Reading Transaction History

### Accessing Transaction History

1. Go to **Dashboard > Transactions**
2. This shows a unified list of all financial activity:

### Transaction Types

| Type | Description |
|------|-------------|
| **Payment Received** | Crypto received from a customer payment |
| **Fee** | MyCryptoCoin platform fee (0.5%) |
| **Withdrawal** | Crypto you sent to an external wallet |
| **Auto-Withdrawal** | Automatic withdrawal triggered by threshold |
| **Refund** | Crypto returned to a customer |

### Filtering Transactions

| Filter | Options |
|--------|---------|
| **Type** | Payment Received, Withdrawal, Fee, Auto-Withdrawal, Refund |
| **Cryptocurrency** | BTC, ETH, USDT, etc. |
| **Status** | Pending, Confirming, Completed, Failed |
| **Date Range** | Custom start and end dates |

### Understanding a Transaction Entry

Each transaction shows:

| Field | Description |
|-------|-------------|
| **ID** | Unique transaction identifier |
| **Type** | What kind of transaction |
| **Crypto** | Which cryptocurrency |
| **Amount** | Gross amount |
| **Fee** | Fee deducted (if applicable) |
| **Net Amount** | Amount after fee |
| **Balance After** | Your wallet balance after this transaction |
| **Reference** | Link to the related payment or withdrawal |
| **TX Hash** | Blockchain transaction ID |
| **Date** | When the transaction occurred |

### Exporting Transactions

1. Apply your desired filters
2. Click **Export**
3. Choose CSV or PDF format
4. Use the CSV export for accounting software (QuickBooks, Xero, Tally, etc.)

---

## Understanding USDT and Auto-Conversion

### What is USDT?

USDT (Tether) is a stablecoin -- a cryptocurrency pegged to the US Dollar. 1 USDT is always approximately equal to $1 USD. This means your USDT balance is not subject to the price swings that affect Bitcoin or Ethereum.

### Why USDT Matters for Your Business

When you accept a payment in Bitcoin, the value can change between when the customer pays and when you withdraw. For example, if you receive 0.001 BTC worth $65 today, it might be worth $60 or $70 tomorrow.

USDT eliminates this risk. Whether a customer pays you $100 in USDT, it stays worth approximately $100.

### Auto-Conversion to USDT

MyCryptoCoin can automatically convert all incoming payments to USDT at the time of settlement. This means:

- Customer pays in BTC, ETH, SOL, or any supported crypto
- MyCryptoCoin converts the received amount to USDT at the current market rate
- You receive USDT in your wallet

To check if auto-conversion is available for your account, visit **Dashboard > Settings > Payment Preferences** or contact support.

### When to Use Auto-Conversion

| Scenario | Recommendation |
|----------|----------------|
| You want stable, predictable revenue | Enable auto-conversion to USDT |
| You want to hold crypto as an investment | Disable auto-conversion |
| You want to withdraw in fiat regularly | Enable auto-conversion (easier to convert USDT to fiat) |
| You accept USDT payments only | Not needed (already in USDT) |

### Refunds in USDT

When issuing refunds, you can choose to refund in USDT regardless of the original payment crypto. This is useful when the original crypto has fluctuated in price since the payment.

---

## Understanding Fees

### Platform Fee

MyCryptoCoin charges a flat **0.5% fee** on every incoming payment. There are no monthly fees, setup fees, or hidden charges.

### How the Fee Works

When a customer pays $100.00 USD in USDT:

| Item | Amount |
|------|--------|
| Customer pays | 100.000000 USDT |
| MyCryptoCoin fee (0.5%) | 0.500000 USDT |
| **You receive** | **99.500000 USDT** |

The fee is deducted automatically when the payment settles to your wallet.

### Network Fees (Withdrawals)

When you withdraw crypto to an external wallet, the blockchain network charges a fee. This fee varies by:
- **Cryptocurrency** -- Bitcoin fees are higher than Tron fees
- **Network congestion** -- Fees increase during high traffic
- **Network chosen** -- For tokens like USDT, Tron is cheaper than Ethereum

MyCryptoCoin does not add any markup to network fees. You pay the actual blockchain fee.

### Example: USDT Withdrawal

| Network | Approximate Fee |
|---------|----------------|
| Tron (TRC-20) | ~1.00 USDT |
| Ethereum (ERC-20) | ~2.50 USDT |
| BNB Smart Chain (BEP-20) | ~0.30 USDT |
| Polygon | ~0.10 USDT |

### No Fee For

- Viewing balances
- Listing payments or transactions
- API key management
- Webhook notifications
- Test mode transactions

### Fee Summary

| Action | Fee |
|--------|-----|
| Receiving payments | 0.5% of payment amount |
| Withdrawals | Blockchain network fee only (no MyCryptoCoin markup) |
| Auto-withdrawals | Blockchain network fee only |
| Account maintenance | Free |
| API access | Free |

---

## Getting Help

### Self-Service Resources

- **Developer Documentation:** https://developers.mycrypto.co.in
- **Status Page:** https://status.mycrypto.co.in (check if there is an ongoing issue)
- **FAQ:** https://mycrypto.co.in/faq

### Contact Support

- **WhatsApp:** +91-9876543210 (fastest response)
- **Email:** support@mycrypto.co.in
- **Developer Support:** developers@mycrypto.co.in

### When Contacting Support

To help us resolve your issue quickly, include:
- Your **Merchant ID** (found in Settings > Profile)
- The **Payment ID** or **Withdrawal ID** related to your issue
- **Screenshots** of any error messages
- A **description** of what happened and what you expected

### Support Hours

- **WhatsApp:** 24/7 (automated responses for common questions, human support during business hours)
- **Email:** Responses within 24 hours on business days
- **Emergency (withdrawal issues):** Flagged as urgent and handled within 4 hours

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:
- **Email:** security@mycrypto.co.in
- Do not disclose vulnerabilities publicly before they are resolved
- We operate a responsible disclosure program
