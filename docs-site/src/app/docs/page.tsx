"use client";

import CodeBlock from "@/components/docs/CodeBlock";
import InfoBox from "@/components/docs/InfoBox";
import EndpointBlock from "@/components/docs/EndpointBlock";
import ParamTable from "@/components/docs/ParamTable";
import TabGroup from "@/components/docs/TabGroup";

function SectionDivider() {
  return <div className="section-divider" />;
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="section-anchor text-2xl font-bold text-dark-50 mb-4 mt-2 scroll-mt-20">
      {children}
    </h2>
  );
}

function SubSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="section-anchor text-lg font-semibold text-dark-100 mb-3 mt-8 scroll-mt-20">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-dark-200 text-sm leading-relaxed mb-4">{children}</p>;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="inline-code">{children}</code>;
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-4 rounded-lg border border-dark-700/50 overflow-x-auto">
      <table className="param-table">
        <thead>
          <tr className="bg-dark-800/20">
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-dark-800/20 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={j === 0 ? "font-mono text-accent-300 text-[13px]" : "text-dark-300 text-sm"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          API v1.0 — Stable
        </div>
        <h1 className="text-4xl font-extrabold text-dark-50 mb-3 tracking-tight">
          MyCryptoCoin Documentation
        </h1>
        <p className="text-lg text-dark-300 max-w-2xl leading-relaxed">
          Accept cryptocurrency payments on your website or app. Integrate with our REST API,
          hosted checkout, WordPress plugin, or one of our SDKs. Supports 10+ cryptocurrencies
          with automatic USDT conversion and instant settlement.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <span className="px-3 py-1 rounded-md bg-dark-700/30 border border-dark-700/50 text-xs text-dark-200 font-medium">Base URL: https://api.mycrypto.co.in/api/v1</span>
          <span className="px-3 py-1 rounded-md bg-dark-700/30 border border-dark-700/50 text-xs text-dark-200 font-medium">Sandbox: https://sandbox.api.mycrypto.co.in/api/v1</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GETTING STARTED */}
      {/* ============================================================ */}

      <SectionTitle id="installation">Installation</SectionTitle>
      <P>
        MyCryptoCoin can be integrated in three ways: install the SDK via npm, run the
        self-hosted Docker image, or use the managed cloud service. Pick the approach that
        fits your stack.
      </P>

      <TabGroup
        tabs={[
          {
            label: "npm / Yarn",
            content: (
              <div>
                <P>Install the official JavaScript/Node.js SDK:</P>
                <CodeBlock
                  code={`# npm
npm install @mycryptocoin/sdk

# yarn
yarn add @mycryptocoin/sdk

# pnpm
pnpm add @mycryptocoin/sdk`}
                  language="bash"
                />
                <P>Then initialize the client:</P>
                <CodeBlock
                  code={`import { MyCryptoCoin } from '@mycryptocoin/sdk';

const mcc = new MyCryptoCoin({
  apiKey: process.env.MCC_API_KEY,
  // sandbox: true  // uncomment for test mode
});`}
                  language="javascript"
                />
              </div>
            ),
          },
          {
            label: "Docker",
            content: (
              <div>
                <P>Run the self-hosted gateway with Docker Compose:</P>
                <CodeBlock
                  code={`# Clone the repository
git clone https://github.com/mycryptocoin/gateway.git
cd gateway

# Copy environment file
cp .env.example .env
# Edit .env with your database, Redis, and wallet config

# Start all services
docker compose up -d

# Services:
#   API:        http://localhost:3001
#   Dashboard:  http://localhost:3002
#   Admin:      http://localhost:3004
#   PostgreSQL: localhost:5432
#   Redis:      localhost:6379`}
                  language="bash"
                />
              </div>
            ),
          },
          {
            label: "Cloud (Managed)",
            content: (
              <div>
                <P>No installation required. Sign up and get your API key:</P>
                <CodeBlock
                  code={`# 1. Sign up at https://dashboard.mycrypto.co.in
# 2. Go to Settings > API Keys
# 3. Generate a test key (mcc_test_...) or live key (mcc_live_...)
# 4. Start making API calls:

curl -X POST https://api.mycrypto.co.in/api/v1/payments/create \\
  -H "X-API-Key: mcc_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"crypto": "USDT_TRC20", "amount": "25.00", "currency": "USD"}'`}
                  language="bash"
                />
              </div>
            ),
          },
        ]}
      />

      <SectionDivider />

      {/* QUICK START */}
      <SectionTitle id="quick-start">Quick Start</SectionTitle>
      <P>
        Accept your first crypto payment in 5 steps. This guide uses the REST API directly
        with cURL, but the same flow applies to all SDKs.
      </P>

      <SubSection id="qs-step1">Step 1: Create Your Account</SubSection>
      <CodeBlock
        code={`curl -X POST https://api.mycrypto.co.in/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@yourbusiness.com",
    "password": "SecurePass123!",
    "businessName": "Your Business Name",
    "phone": "+919876543210"
  }'`}
        language="bash"
      />
      <P>
        A 6-digit OTP is sent to your WhatsApp number. Verify it:
      </P>
      <CodeBlock
        code={`curl -X POST https://api.mycrypto.co.in/api/v1/auth/verify-whatsapp-otp \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+919876543210",
    "otp": "482916",
    "purpose": "registration"
  }'`}
        language="bash"
      />

      <SubSection id="qs-step2">Step 2: Get Your API Key</SubSection>
      <P>
        Log in to the <a href="https://dashboard.mycrypto.co.in" className="text-accent-400 hover:text-accent-300 underline underline-offset-2">dashboard</a> and
        navigate to <strong className="text-dark-100">Settings &gt; API Keys</strong>. Generate
        a test key (<InlineCode>mcc_test_...</InlineCode>) for development and a
        live key (<InlineCode>mcc_live_...</InlineCode>) for production.
      </P>

      <SubSection id="qs-step3">Step 3: Create a Payment</SubSection>
      <CodeBlock
        tabs={[
          {
            label: "cURL",
            language: "bash",
            code: `curl -X POST https://api.mycrypto.co.in/api/v1/payments/create \\
  -H "X-API-Key: mcc_test_YOUR_TEST_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "crypto": "USDT_TRC20",
    "amount": "10.00",
    "currency": "USD",
    "description": "Test payment",
    "metadata": { "order_id": "TEST-001" },
    "redirectUrl": "https://yoursite.com/success",
    "expiryMinutes": 30
  }'`,
          },
          {
            label: "JavaScript",
            language: "javascript",
            code: `const payment = await mcc.payments.create({
  crypto: 'USDT_TRC20',
  amount: '10.00',
  currency: 'USD',
  description: 'Test payment',
  metadata: { order_id: 'TEST-001' },
  redirectUrl: 'https://yoursite.com/success',
  expiryMinutes: 30,
});

console.log(payment.checkout_url);`,
          },
          {
            label: "Python",
            language: "python",
            code: `payment = mcc.create_payment(
    crypto='USDT_TRC20',
    amount='10.00',
    currency='USD',
    description='Test payment',
    metadata={'order_id': 'TEST-001'},
    redirectUrl='https://yoursite.com/success',
    expiryMinutes=30,
)

print(payment['checkout_url'])`,
          },
          {
            label: "PHP",
            language: "php",
            code: `$payment = $mcc->createPayment('10.00', 'USD', 'USDT_TRC20', [
    'description' => 'Test payment',
    'metadata' => ['order_id' => 'TEST-001'],
    'redirectUrl' => 'https://yoursite.com/success',
    'expiryMinutes' => 30,
]);

echo $payment['checkout_url'];`,
          },
          {
            label: "Ruby",
            language: "ruby",
            code: `payment = mcc.payments.create(
  crypto: 'USDT_TRC20',
  amount: '10.00',
  currency: 'USD',
  description: 'Test payment',
  metadata: { order_id: 'TEST-001' },
  redirect_url: 'https://yoursite.com/success',
  expiry_minutes: 30,
)

puts payment.checkout_url`,
          },
        ]}
      />
      <P>
        The response includes a <InlineCode>checkout_url</InlineCode>. Open it in
        your browser to see the hosted payment page. In test mode, payments auto-confirm
        after 30 seconds.
      </P>

      <SubSection id="qs-step4">Step 4: Handle the Webhook</SubSection>
      <P>
        When the payment confirms, MyCryptoCoin sends a webhook POST to your server.
        Register your endpoint and handle the event:
      </P>
      <CodeBlock
        code={`curl -X POST https://api.mycrypto.co.in/api/v1/webhooks \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed"]
  }'`}
        language="bash"
        title="Register webhook"
      />
      <InfoBox type="warning">
        Save the <InlineCode>secret</InlineCode> from the response. It is shown only once.
        You need it to verify webhook signatures.
      </InfoBox>

      <SubSection id="qs-step5">Step 5: Go Live</SubSection>
      <P>Before switching to production, complete this checklist:</P>
      <div className="my-4 space-y-2 text-sm text-dark-200">
        {[
          "Replace mcc_test_ with mcc_live_ API key",
          "Use production base URL (api.mycrypto.co.in)",
          "Implement webhook signature verification",
          "Handle all payment statuses (expired, failed, underpaid)",
          "Add error handling with exponential backoff",
          "Enable auto-withdrawal (optional)",
          "Make a small real payment to test end-to-end",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2">
            <div className="w-4 h-4 mt-0.5 rounded border border-dark-600 flex-shrink-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-sm bg-dark-600" />
            </div>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <SectionDivider />

      {/* AUTHENTICATION */}
      <SectionTitle id="authentication">Authentication</SectionTitle>
      <P>
        MyCryptoCoin supports two authentication methods. Choose based on your use case.
      </P>

      <SubSection id="auth-api-key">API Key Authentication</SubSection>
      <P>
        Best for server-to-server integrations, backend services, and automated systems.
        API keys are long-lived credentials. Pass the key in the <InlineCode>X-API-Key</InlineCode> header:
      </P>
      <CodeBlock
        code={`curl https://api.mycrypto.co.in/api/v1/payments \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"`}
        language="bash"
      />
      <SimpleTable
        headers={["Prefix", "Environment", "Description"]}
        rows={[
          ["mcc_live_", "Production", "Processes real transactions on mainnet"],
          ["mcc_test_", "Sandbox", "Test transactions only, no real funds"],
        ]}
      />

      <SubSection id="auth-bearer">Bearer Token Authentication</SubSection>
      <P>
        Best for dashboard sessions, mobile apps, and frontend integrations where the user
        logs in. Bearer tokens are short-lived JWTs (24-hour access, 30-day refresh).
      </P>
      <CodeBlock
        code={`curl https://api.mycrypto.co.in/api/v1/payments \\
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."`}
        language="bash"
      />

      <SubSection id="auth-when-to-use">When to Use Which</SubSection>
      <SimpleTable
        headers={["Scenario", "Method", "Why"]}
        rows={[
          ["E-commerce backend creating payments", "API Key", "Long-lived, no refresh needed"],
          ["Webhook endpoint processing events", "API Key", "Server-to-server, no user session"],
          ["Dashboard frontend (React, Vue)", "Bearer Token", "User login session, short-lived"],
          ["Mobile app", "Bearer Token", "User-specific session"],
          ["WordPress plugin", "API Key", "Stored in plugin settings"],
          ["Cron job checking balances", "API Key", "Automated, no user interaction"],
        ]}
      />

      <InfoBox type="danger">
        Never expose live API keys in client-side code. Use them only on your server.
        Store keys in environment variables, never in source code or version control.
      </InfoBox>

      <SectionDivider />

      {/* FIRST PAYMENT */}
      <SectionTitle id="first-payment">First Payment</SectionTitle>
      <P>
        The complete payment flow in four stages: create payment, customer pays, webhook fires,
        order fulfilled.
      </P>

      <div className="ascii-diagram my-6">
{`Your Server                    MyCryptoCoin                 Customer
    |                               |                           |
    |--- POST /payments/create ---->|                           |
    |<-- checkout_url, address -----|                           |
    |                               |                           |
    |--- Redirect customer -------->|-------------------------->|
    |                               |     Hosted checkout page  |
    |                               |<---- Sends crypto --------|
    |                               |                           |
    |<-- Webhook: payment.confirmed |                           |
    |                               |--- Redirect to your ----->|
    |    Fulfill the order          |    redirect_url           |
    |                               |                           |`}
      </div>

      <InfoBox type="success" title="Hosted Checkout">
        For the easiest integration, redirect customers to the
        <InlineCode>checkout_url</InlineCode> returned by the API. MyCryptoCoin handles the
        payment UI, QR code, countdown timer, and confirmation screen.
      </InfoBox>

      <SectionDivider />

      {/* TESTING */}
      <SectionTitle id="testing">Testing (Test Mode)</SectionTitle>
      <P>
        Test mode lets you simulate the full payment lifecycle without real cryptocurrency.
        Use your <InlineCode>mcc_test_</InlineCode> API key against the sandbox URL.
      </P>

      <SimpleTable
        headers={["Feature", "Test Mode", "Live Mode"]}
        rows={[
          ["Base URL", "sandbox.api.mycrypto.co.in/api/v1", "api.mycrypto.co.in/api/v1"],
          ["API Key Prefix", "mcc_test_", "mcc_live_"],
          ["Real transactions", "No", "Yes"],
          ["Auto-confirmation", "30 seconds", "Depends on blockchain"],
          ["Pre-funded wallets", "Yes (1 BTC, 10 ETH, 10000 USDT)", "No"],
          ["Webhooks", "Sent normally", "Sent normally"],
        ]}
      />

      <P>In test mode, append a suffix to the <InlineCode>description</InlineCode> field to simulate outcomes:</P>
      <SimpleTable
        headers={["Description Suffix", "Result"]}
        rows={[
          ["_succeed", "Payment confirms after 30 seconds"],
          ["_fail", "Payment fails after 15 seconds"],
          ["_expire", "Payment expires after 60 seconds"],
          ["_underpaid", "Payment fails with underpaid status"],
        ]}
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* CONFIGURATION */}
      {/* ============================================================ */}

      <SectionTitle id="api-keys">API Keys</SectionTitle>
      <P>
        API keys authenticate your server-to-server requests. Each key has a mode (test/live),
        scoped permissions, and can be revoked instantly.
      </P>

      <SubSection id="api-keys-generate">Generating API Keys</SubSection>
      <P>Via the dashboard: <strong className="text-dark-100">Settings &gt; API Keys &gt; Generate New Key</strong>. Or via API:</P>
      <EndpointBlock method="POST" path="/api/v1/merchant/api-keys" description="Create a new API key" />
      <CodeBlock
        code={`curl -X POST https://api.mycrypto.co.in/api/v1/merchant/api-keys \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Server",
    "mode": "live",
    "permissions": ["payments:read", "payments:write", "wallets:read"]
  }'`}
        language="bash"
      />
      <P>Response:</P>
      <CodeBlock
        code={`{
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
}`}
        language="json"
      />

      <InfoBox type="danger">
        The full <InlineCode>key</InlineCode> value is returned only once. Store it securely in
        environment variables or a secrets manager. If lost, revoke and generate a new one.
      </InfoBox>

      <SubSection id="api-keys-permissions">Permissions</SubSection>
      <SimpleTable
        headers={["Permission", "Description"]}
        rows={[
          ["payments:read", "List and view payments"],
          ["payments:write", "Create payments, verify payments"],
          ["wallets:read", "View wallet balances"],
          ["wallets:write", "Configure auto-withdrawal, create withdrawals"],
          ["transactions:read", "List transactions"],
          ["webhooks:manage", "Create, update, delete webhooks"],
        ]}
      />

      <SubSection id="api-keys-revoke">Revoking Keys</SubSection>
      <EndpointBlock method="DELETE" path="/api/v1/merchant/api-keys/{id}" description="Revoke immediately" />
      <CodeBlock
        code={`curl -X DELETE https://api.mycrypto.co.in/api/v1/merchant/api-keys/key_p1q2r3s4t5 \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        language="bash"
      />

      <SectionDivider />

      {/* WEBHOOKS CONFIG */}
      <SectionTitle id="webhooks">Webhooks</SectionTitle>
      <P>
        Webhooks send real-time HTTP POST notifications to your server when events occur.
        Use them to automate order fulfillment, update payment status, and track withdrawals.
      </P>

      <SubSection id="webhooks-events">Event Types</SubSection>
      <SimpleTable
        headers={["Event", "Description"]}
        rows={[
          ["payment.created", "A new payment was created"],
          ["payment.confirming", "Transaction detected, awaiting confirmations"],
          ["payment.confirmed", "Payment received required confirmations"],
          ["payment.completed", "Funds credited to your wallet"],
          ["payment.expired", "Payment window expired with no transaction"],
          ["payment.failed", "Payment failed (underpaid, wrong token)"],
          ["withdrawal.initiated", "Withdrawal request submitted"],
          ["withdrawal.completed", "Withdrawal confirmed on-chain"],
          ["withdrawal.failed", "Withdrawal failed"],
        ]}
      />

      <SubSection id="webhooks-payload">Webhook Payload</SubSection>
      <CodeBlock
        code={`{
  "event": "payment.confirmed",
  "timestamp": "2026-03-19T10:45:22Z",
  "webhookId": "whk_m1n2o3p4q5",
  "data": {
    "id": "pay_1a2b3c4d5e6f",
    "merchant_id": "mch_a1b2c3d4e5f6",
    "status": "confirmed",
    "amount": 99.99,
    "currency": "USD",
    "crypto": "USDT",
    "crypto_amount": "99.990000",
    "exchange_rate": "1.0000",
    "fee_amount": "0.499950",
    "net_amount": "99.490050",
    "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "network": "ethereum",
    "tx_hash": "0xabc123def456789...",
    "confirmations": 12,
    "required_confirmations": 12,
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "confirmed_at": "2026-03-19T10:45:22Z",
    "created_at": "2026-03-19T10:30:00Z"
  }
}`}
        language="json"
      />

      <SubSection id="webhooks-headers">Headers Sent with Webhooks</SubSection>
      <SimpleTable
        headers={["Header", "Description"]}
        rows={[
          ["X-MCC-Signature", "HMAC-SHA256 hex signature of the raw request body"],
          ["X-MCC-Event", "Event type (e.g., payment.confirmed)"],
          ["X-MCC-Timestamp", "ISO 8601 timestamp of the delivery"],
          ["Content-Type", "application/json"],
          ["User-Agent", "MyCryptoCoin-Webhook/1.0"],
        ]}
      />

      <SubSection id="webhooks-register">Register a Webhook</SubSection>
      <EndpointBlock method="POST" path="/api/v1/webhooks" description="Create a new webhook endpoint" />
      <ParamTable
        title="Request Body"
        params={[
          { name: "url", type: "string", required: true, description: "HTTPS endpoint URL" },
          { name: "events", type: "string[]", required: true, description: 'Event types to subscribe to (or ["*"] for all)' },
          { name: "description", type: "string", required: false, description: "Descriptive label (max 200 chars)" },
          { name: "active", type: "boolean", required: false, description: "Whether the webhook is active (default: true)" },
        ]}
      />

      <SubSection id="webhooks-retry">Retry Policy</SubSection>
      <P>
        If your endpoint does not respond with a 2xx status code within 10 seconds,
        MyCryptoCoin retries:
      </P>
      <SimpleTable
        headers={["Attempt", "Delay After Previous"]}
        rows={[
          ["1st retry", "5 seconds"],
          ["2nd retry", "30 seconds"],
          ["3rd retry", "2 minutes"],
        ]}
      />
      <P>
        After 3 total attempts, the delivery is marked as failed. After 10 consecutive failures,
        the webhook endpoint is automatically disabled.
      </P>

      <InfoBox type="success" title="Best Practice">
        Respond with 200 immediately and process the event asynchronously. Use the
        <InlineCode>webhookId</InlineCode> field for idempotency tracking.
      </InfoBox>

      <SectionDivider />

      {/* SUPPORTED CRYPTOS */}
      <SectionTitle id="supported-cryptos">Supported Cryptocurrencies</SectionTitle>
      <P>
        MyCryptoCoin supports 10+ major cryptocurrencies. Each has different confirmation
        requirements and processing times.
      </P>
      <SimpleTable
        headers={["Crypto", "Symbol", "Confirmations", "Approx. Time"]}
        rows={[
          ["Bitcoin", "BTC", "3", "~30 minutes"],
          ["Ethereum", "ETH", "12", "~3 minutes"],
          ["USDT (ERC-20)", "USDT_ERC20", "12", "~3 minutes"],
          ["USDT (TRC-20)", "USDT_TRC20", "20", "~1 minute"],
          ["BNB", "BNB", "15", "~1 minute"],
          ["Solana", "SOL", "32", "~15 seconds"],
          ["Polygon", "MATIC", "30", "~1 minute"],
          ["Litecoin", "LTC", "6", "~15 minutes"],
          ["XRP", "XRP", "1", "~4 seconds"],
          ["Dogecoin", "DOGE", "6", "~6 minutes"],
        ]}
      />

      <SectionDivider />

      {/* AUTO-CONVERT */}
      <SectionTitle id="auto-convert">Auto-Convert (USDT)</SectionTitle>
      <P>
        All incoming cryptocurrency payments are automatically converted to USDT TRC-20
        and credited to your USDT balance. This protects you from price volatility --
        the amount you see at settlement is the amount you get.
      </P>
      <InfoBox type="info" title="How Auto-Convert Works">
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Customer pays in BTC, ETH, or any supported crypto</li>
          <li>MyCryptoCoin receives the payment and confirms it on-chain</li>
          <li>The crypto is instantly swapped to USDT at the current market rate</li>
          <li>USDT is credited to your wallet balance (minus 0.5% platform fee)</li>
          <li>You withdraw USDT to your TRON address whenever you want</li>
        </ol>
      </InfoBox>
      <P>
        The conversion rate is locked at the time the payment is created (when the customer
        clicks "Pay"). This rate is shown in the <InlineCode>exchange_rate</InlineCode> field
        of the payment object. Any conversion spread or network fees for the swap are borne
        by the platform, not the merchant.
      </P>

      <SectionDivider />

      {/* FEE STRUCTURE */}
      <SectionTitle id="fee-structure">Fee Structure</SectionTitle>
      <P>
        MyCryptoCoin charges a flat 0.5% fee on every payment. No hidden fees, no monthly
        charges, no setup costs.
      </P>
      <SimpleTable
        headers={["Fee Type", "Amount", "Who Pays"]}
        rows={[
          ["Platform fee", "0.5% of crypto_amount", "Deducted from settlement"],
          ["Conversion spread", "Included in exchange rate", "Platform absorbs"],
          ["Blockchain network fee (deposits)", "Paid by customer", "Customer"],
          ["Blockchain network fee (withdrawals)", "Deducted from withdrawal", "Merchant"],
        ]}
      />
      <P>
        Example: Customer pays 100.00 USDT. Platform fee = 0.50 USDT. You receive 99.50 USDT
        in your wallet.
      </P>
      <CodeBlock
        code={`{
  "amount": 100.00,
  "crypto_amount": "100.000000",
  "fee_amount": "0.500000",
  "fee_percent": "0.5",
  "net_amount": "99.500000"
}`}
        language="json"
        title="Fee calculation in payment response"
      />

      <SectionDivider />

      {/* WHATSAPP SETUP */}
      <SectionTitle id="whatsapp-setup">WhatsApp Setup</SectionTitle>
      <P>
        MyCryptoCoin uses WhatsApp for OTP delivery, two-factor authentication, and
        payment notifications. WhatsApp is required for account registration and
        sensitive operations.
      </P>
      <SubSection id="whatsapp-otp">OTP via WhatsApp</SubSection>
      <SimpleTable
        headers={["Property", "Value"]}
        rows={[
          ["Length", "6 digits"],
          ["Expiry", "10 minutes"],
          ["Max attempts", "5 (locked for 30 minutes after)"],
          ["Delivery", "WhatsApp message"],
          ["Rate limit", "Maximum 5 OTPs per hour"],
        ]}
      />
      <P>
        OTP is required for: account registration, password reset, configuring auto-withdrawal
        addresses, manual withdrawals, changing WhatsApp number, and deleting your account.
      </P>

      <SectionDivider />

      {/* EMAIL NOTIFICATIONS */}
      <SectionTitle id="email-notifications">Email Notifications</SectionTitle>
      <P>
        Configure email notifications for payment events in
        <strong className="text-dark-100"> Dashboard &gt; Settings &gt; Notifications</strong>.
        Available notifications:
      </P>
      <SimpleTable
        headers={["Notification", "Description", "Default"]}
        rows={[
          ["Payment received", "When a payment is confirmed", "On"],
          ["Payment failed", "When a payment fails or expires", "On"],
          ["Withdrawal completed", "When a withdrawal is confirmed on-chain", "On"],
          ["Withdrawal failed", "When a withdrawal fails", "On"],
          ["Daily summary", "Daily recap of payments and volume", "Off"],
          ["Weekly report", "Weekly business metrics", "Off"],
          ["Security alerts", "Failed login attempts, API key usage from new IPs", "On"],
        ]}
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* PAYMENTS */}
      {/* ============================================================ */}

      <SectionTitle id="create-payment">Create Payment</SectionTitle>
      <P>
        Creates a new crypto payment and returns a unique deposit address.
        The customer sends the exact <InlineCode>crypto_amount</InlineCode> to
        the <InlineCode>deposit_address</InlineCode>.
      </P>
      <EndpointBlock method="POST" path="/api/v1/payments/create" description="Create a new payment" />

      <ParamTable
        title="Request Body"
        params={[
          { name: "crypto", type: "string", required: true, description: "Cryptocurrency symbol (BTC, ETH, USDT_ERC20, USDT_TRC20, BNB, SOL, MATIC, LTC, DOGE, XRP)" },
          { name: "amount", type: "string", required: true, description: "Payment amount as a decimal string (must be > 0)" },
          { name: "currency", type: "string", required: false, description: "ISO 4217 currency code (default: USD)" },
          { name: "description", type: "string", required: false, description: "Description shown to customer (max 500 chars)" },
          { name: "orderId", type: "string", required: false, description: "Your internal order ID (max 100 chars)" },
          { name: "customerEmail", type: "string", required: false, description: "Customer email address" },
          { name: "customerName", type: "string", required: false, description: "Customer name (max 200 chars)" },
          { name: "callbackUrl", type: "string", required: false, description: "Webhook URL for this specific payment" },
          { name: "redirectUrl", type: "string", required: false, description: "URL to redirect customer after payment" },
          { name: "expiryMinutes", type: "integer", required: false, description: "Expiry window in minutes (5-1440, default: 30)" },
          { name: "metadata", type: "object", required: false, description: "Key-value pairs for your reference" },
        ]}
      />

      <CodeBlock
        tabs={[
          {
            label: "cURL",
            language: "bash",
            code: `curl -X POST https://api.mycrypto.co.in/api/v1/payments/create \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "crypto": "USDT_ERC20",
    "amount": "99.99",
    "currency": "USD",
    "description": "Premium subscription - March 2026",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "callbackUrl": "https://yoursite.com/webhooks/crypto",
    "redirectUrl": "https://yoursite.com/order/success",
    "expiryMinutes": 30
  }'`,
          },
          {
            label: "JavaScript",
            language: "javascript",
            code: `const { mccRequest } = require('./mcc-client');

const payment = await mccRequest('POST', '/payments/create', {
  crypto: 'USDT_ERC20',
  amount: '99.99',
  currency: 'USD',
  description: 'Premium subscription - March 2026',
  metadata: {
    order_id: 'ORD-12345',
    customer_email: 'buyer@example.com',
  },
  callbackUrl: 'https://yoursite.com/webhooks/crypto',
  redirectUrl: 'https://yoursite.com/order/success',
  expiryMinutes: 30,
});

console.log('Checkout URL:', payment.checkout_url);
console.log('Deposit address:', payment.deposit_address);`,
          },
          {
            label: "Python",
            language: "python",
            code: `from mcc_client import MCCClient

mcc = MCCClient()

payment = mcc.create_payment(
    amount='99.99',
    currency='USD',
    crypto='USDT_ERC20',
    description='Premium subscription - March 2026',
    metadata={
        'order_id': 'ORD-12345',
        'customer_email': 'buyer@example.com',
    },
    callbackUrl='https://yoursite.com/webhooks/crypto',
    redirectUrl='https://yoursite.com/order/success',
    expiryMinutes=30,
)

print(f"Checkout URL: {payment['checkout_url']}")`,
          },
          {
            label: "PHP",
            language: "php",
            code: `$mcc = new MccClient();

$payment = $mcc->createPayment('99.99', 'USD', 'USDT_ERC20', [
    'description' => 'Premium subscription - March 2026',
    'metadata' => [
        'order_id' => 'ORD-12345',
        'customer_email' => 'buyer@example.com',
    ],
    'callbackUrl' => 'https://yoursite.com/webhooks/crypto',
    'redirectUrl' => 'https://yoursite.com/order/success',
    'expiryMinutes' => 30,
]);

echo "Checkout URL: " . $payment['checkout_url'];`,
          },
          {
            label: "Ruby",
            language: "ruby",
            code: `payment = mcc.payments.create(
  crypto: 'USDT_ERC20',
  amount: '99.99',
  currency: 'USD',
  description: 'Premium subscription - March 2026',
  metadata: {
    order_id: 'ORD-12345',
    customer_email: 'buyer@example.com',
  },
  callback_url: 'https://yoursite.com/webhooks/crypto',
  redirect_url: 'https://yoursite.com/order/success',
  expiry_minutes: 30,
)

puts "Checkout URL: #{payment.checkout_url}"`,
          },
        ]}
      />

      <P>Response (201 Created):</P>
      <CodeBlock
        code={`{
  "id": "pay_1a2b3c4d5e6f",
  "merchant_id": "mch_a1b2c3d4e5f6",
  "status": "pending",
  "amount": 99.99,
  "currency": "USD",
  "crypto": "USDT",
  "crypto_amount": "99.990000",
  "exchange_rate": "1.0000",
  "fee_amount": "0.499950",
  "fee_percent": "0.5",
  "net_amount": "99.490050",
  "deposit_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "network": "ethereum",
  "tx_hash": null,
  "confirmations": 0,
  "required_confirmations": 12,
  "description": "Premium subscription - March 2026",
  "metadata": {
    "order_id": "ORD-12345",
    "customer_email": "buyer@example.com"
  },
  "callback_url": "https://yoursite.com/webhooks/crypto",
  "redirect_url": "https://yoursite.com/order/success",
  "checkout_url": "https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f",
  "qr_code_url": "https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/qr",
  "expires_at": "2026-03-19T11:00:00Z",
  "confirmed_at": null,
  "settled_at": null,
  "created_at": "2026-03-19T10:30:00Z",
  "updated_at": "2026-03-19T10:30:00Z"
}`}
        language="json"
      />

      <SectionDivider />

      {/* PAYMENT STATUS */}
      <SectionTitle id="payment-status">Payment Status</SectionTitle>
      <P>
        Retrieve the current status and details of a specific payment, or verify it against
        the blockchain.
      </P>

      <SubSection id="get-payment">Get Payment</SubSection>
      <EndpointBlock method="GET" path="/api/v1/payments/{id}" description="Retrieve payment details" />
      <CodeBlock
        code={`curl https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"`}
        language="bash"
      />

      <SubSection id="list-payments">List Payments</SubSection>
      <EndpointBlock method="GET" path="/api/v1/payments" description="Paginated list with filters" />
      <ParamTable
        title="Query Parameters"
        params={[
          { name: "status", type: "string", required: false, description: "Filter by status (PENDING, CONFIRMING, CONFIRMED, COMPLETED, EXPIRED, FAILED, REFUNDED)" },
          { name: "crypto", type: "string", required: false, description: "Filter by crypto symbol" },
          { name: "startDate", type: "string", required: false, description: "ISO 8601 start date" },
          { name: "endDate", type: "string", required: false, description: "ISO 8601 end date" },
          { name: "orderId", type: "string", required: false, description: "Filter by your order ID" },
          { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
          { name: "limit", type: "integer", required: false, description: "Items per page (max 100, default: 20)" },
        ]}
      />

      <SubSection id="verify-payment">Verify Payment</SubSection>
      <EndpointBlock method="POST" path="/api/v1/payments/{id}/verify" description="Blockchain verification" />
      <P>
        Perform a real-time blockchain check. Use as a fallback when you missed a webhook or
        want to double-check before fulfilling a high-value order.
      </P>
      <CodeBlock
        code={`curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/verify \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \\
  -H "Content-Type: application/json" \\
  -d '{ "txHash": "0xabc123def456789..." }'`}
        language="bash"
      />
      <SimpleTable
        headers={["verified", "status", "Action"]}
        rows={[
          ["true", "confirmed / settled", "Safe to fulfill the order"],
          ["false", "confirming", "Wait for more confirmations"],
          ["false", "pending", "Customer hasn't paid yet"],
          ["false", "expired", "Payment window closed"],
          ["false", "failed", "Transaction failed"],
        ]}
      />

      <SectionDivider />

      {/* PAYMENT LIFECYCLE */}
      <SectionTitle id="payment-lifecycle">Payment Lifecycle</SectionTitle>
      <P>Every payment follows this status flow:</P>
      <div className="ascii-diagram my-6">
{`  pending ──────> confirming ──────> confirmed ──────> settled
    │                                     │
    ├──> expired                          └──> refunded
    │
    └──> failed`}
      </div>
      <SimpleTable
        headers={["Status", "Description"]}
        rows={[
          ["pending", "Payment created, waiting for customer to send crypto"],
          ["confirming", "Transaction detected on-chain, waiting for block confirmations"],
          ["confirmed", "Required confirmations reached, payment is verified"],
          ["settled", "Funds credited to your MyCryptoCoin wallet"],
          ["expired", "No transaction received before the expiry window"],
          ["failed", "Transaction failed (underpaid, wrong token, network error)"],
          ["refunded", "Payment was refunded to the customer"],
        ]}
      />

      <SubSection id="underpayment">Underpayment Handling</SubSection>
      <P>
        If a customer sends less than the required <InlineCode>crypto_amount</InlineCode>,
        the payment status moves to <InlineCode>failed</InlineCode> with reason <InlineCode>underpaid</InlineCode>.
        The partial amount is held for 72 hours. Contact support to arrange a refund or request the
        remaining amount.
      </P>

      <SubSection id="overpayment">Overpayment Handling</SubSection>
      <P>
        If a customer sends more than required, the payment is confirmed normally. The excess
        amount is credited to your wallet. It is your responsibility to refund any overpayment.
      </P>

      <SectionDivider />

      {/* HOSTED CHECKOUT */}
      <SectionTitle id="hosted-checkout">Hosted Checkout Page</SectionTitle>
      <P>
        The easiest way to accept payments. Create a payment via API and redirect the customer
        to the <InlineCode>checkout_url</InlineCode>. MyCryptoCoin handles the payment UI, QR code,
        countdown timer, and confirmation screen.
      </P>
      <CodeBlock
        code={`<!-- Redirect link -->
<a href="https://pay.mycrypto.co.in/pay_1a2b3c4d5e6f">Pay with Crypto</a>

<!-- Or JavaScript redirect -->
<script>
  window.location.href = payment.checkout_url;
</script>`}
        language="html"
      />
      <InfoBox type="info">
        When the payment is confirmed, the customer is automatically redirected to your
        <InlineCode>redirect_url</InlineCode>. You should also handle the webhook for
        server-side fulfillment.
      </InfoBox>

      <SectionDivider />

      {/* CUSTOM CHECKOUT */}
      <SectionTitle id="custom-checkout">Custom Checkout</SectionTitle>
      <P>
        Build your own payment interface using the <InlineCode>deposit_address</InlineCode>,
        <InlineCode>crypto_amount</InlineCode>, and <InlineCode>qr_code_url</InlineCode> from
        the payment response.
      </P>
      <CodeBlock
        code={`<!-- Display payment details in your own UI -->
<div class="payment-page">
  <h2>Send exactly 99.990000 USDT to:</h2>
  <code>0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18</code>
  <img src="https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/qr"
       alt="QR Code" />
  <p>Payment expires in: <span id="timer">30:00</span></p>
</div>`}
        language="html"
      />
      <P>
        You are responsible for implementing the countdown timer and status polling. Use the
        webhook for real-time updates, or poll <InlineCode>GET /payments/{'{id}'}</InlineCode> as
        a fallback (rate limited to 100 req/min).
      </P>

      <SectionDivider />

      {/* ============================================================ */}
      {/* WALLETS & WITHDRAWALS */}
      {/* ============================================================ */}

      <SectionTitle id="usdt-balance">USDT Balance</SectionTitle>
      <P>
        All payments are auto-converted to USDT and credited to a single USDT TRC-20 balance.
        View your balances with the Wallets API.
      </P>
      <EndpointBlock method="GET" path="/api/v1/wallets" description="List all wallet balances" />
      <CodeBlock
        tabs={[
          {
            label: "cURL",
            language: "bash",
            code: `curl https://api.mycrypto.co.in/api/v1/wallets \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"`,
          },
          {
            label: "JavaScript",
            language: "javascript",
            code: `const wallets = await mccRequest('GET', '/wallets');
wallets.data.forEach(w => {
  console.log(\`\${w.crypto}: \${w.balance} (\$\${w.balance_usd})\`);
});`,
          },
          {
            label: "Python",
            language: "python",
            code: `wallets = mcc.get_wallets()
for w in wallets['data']:
    print(f"{w['crypto']}: {w['balance']} (\${w['balance_usd']})")`,
          },
        ]}
      />
      <P>Response:</P>
      <CodeBlock
        code={`{
  "data": [
    {
      "crypto": "USDT",
      "name": "Tether",
      "balance": "12450.500000",
      "pending_balance": "99.990000",
      "balance_usd": "12450.50",
      "deposit_address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9",
      "network": "tron",
      "auto_withdraw": {
        "enabled": false,
        "address": null,
        "threshold": null
      },
      "updated_at": "2026-03-19T10:45:30Z"
    }
  ]
}`}
        language="json"
      />

      <SectionDivider />

      {/* WITHDRAWAL PROCESS */}
      <SectionTitle id="withdrawal-process">Withdrawal Process</SectionTitle>
      <P>
        Withdraw cryptocurrency from your MyCryptoCoin wallet to any external address.
        The crypto is specified in the URL path.
      </P>
      <EndpointBlock method="POST" path="/api/v1/wallets/{crypto}/withdraw" description="Create withdrawal" />
      <ParamTable
        title="Request Body"
        params={[
          { name: "address", type: "string", required: true, description: "Destination wallet address" },
          { name: "amount", type: "string", required: true, description: "Amount to withdraw (decimal string, must be > 0)" },
          { name: "memo", type: "string", required: false, description: "Memo/tag (required for XRP, optional for exchanges)" },
        ]}
      />

      <CodeBlock
        tabs={[
          {
            label: "cURL",
            language: "bash",
            code: `curl -X POST https://api.mycrypto.co.in/api/v1/wallets/USDT_TRC20/withdraw \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "500.000000",
    "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9"
  }'`,
          },
          {
            label: "JavaScript",
            language: "javascript",
            code: `const withdrawal = await mccRequest('POST', '/wallets/USDT_TRC20/withdraw', {
  amount: '500.000000',
  address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
});

console.log('Withdrawal ID:', withdrawal.id);
console.log('Net amount:', withdrawal.net_amount);`,
          },
          {
            label: "Python",
            language: "python",
            code: `withdrawal = mcc.create_withdrawal(
    'USDT_TRC20',
    '500.000000',
    'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
)

print(f"Withdrawal ID: {withdrawal['id']}")
print(f"Net amount: {withdrawal['net_amount']}")`,
          },
        ]}
      />

      <SubSection id="withdrawal-minimums">Minimum Withdrawal Amounts</SubSection>
      <SimpleTable
        headers={["Crypto", "Minimum", "Network Fee (approx.)"]}
        rows={[
          ["BTC", "0.0001", "0.00005 BTC"],
          ["ETH", "0.001", "0.0005 ETH"],
          ["USDT (ERC-20)", "1.00", "2.50 USDT"],
          ["USDT (TRC-20)", "1.00", "1.00 USDT"],
          ["BNB", "0.001", "0.0005 BNB"],
          ["SOL", "0.01", "0.000005 SOL"],
          ["MATIC", "1.00", "0.01 MATIC"],
          ["DOGE", "5.00", "1.00 DOGE"],
          ["LTC", "0.001", "0.0001 LTC"],
          ["XRP", "0.10", "0.0001 XRP"],
        ]}
      />

      <SubSection id="withdrawal-status-flow">Withdrawal Status Flow</SubSection>
      <div className="ascii-diagram my-4">
{`  pending ──> processing ──> completed
                  │
                  ├──> failed
                  │
                  └──> cancelled`}
      </div>

      <SectionDivider />

      {/* AUTO-WITHDRAW */}
      <SectionTitle id="auto-withdraw">Auto-Withdraw</SectionTitle>
      <P>
        Configure automatic withdrawals to an external wallet when your balance exceeds a threshold.
        The entire available balance (minus network fees) is sent to your configured address.
      </P>
      <EndpointBlock method="PUT" path="/api/v1/wallets/{crypto}/auto-withdraw" description="Configure auto-withdrawal" />
      <CodeBlock
        code={`curl -X PUT https://api.mycrypto.co.in/api/v1/wallets/USDT_TRC20/auto-withdraw \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \\
  -H "Content-Type: application/json" \\
  -d '{
    "enabled": true,
    "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9",
    "threshold": "100.000000"
  }'`}
        language="bash"
      />
      <InfoBox type="warning">
        Changing the auto-withdrawal address requires WhatsApp OTP verification for security.
        If an auto-withdrawal fails, it retries after 10 minutes (up to 3 attempts).
      </InfoBox>

      <SectionDivider />

      {/* TRANSACTION HISTORY */}
      <SectionTitle id="transaction-history">Transaction History</SectionTitle>
      <P>
        Retrieve a unified history of all payments and withdrawals.
      </P>
      <EndpointBlock method="GET" path="/api/v1/transactions" description="List all transactions" />
      <CodeBlock
        code={`curl "https://api.mycrypto.co.in/api/v1/transactions?page=1&limit=20" \\
  -H "X-API-Key: mcc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"`}
        language="bash"
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* MERCHANT API */}
      {/* ============================================================ */}

      <SectionTitle id="merchant-profile">Merchant Profile</SectionTitle>
      <P>View and update your merchant profile.</P>
      <EndpointBlock method="GET" path="/api/v1/merchant/profile" description="Get your profile" />
      <EndpointBlock method="PUT" path="/api/v1/merchant/profile" description="Update profile" />
      <CodeBlock
        code={`curl -X PUT https://api.mycrypto.co.in/api/v1/merchant/profile \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "businessName": "Acme Digital Services Pvt Ltd",
    "website": "https://acmedigital.com"
  }'`}
        language="bash"
      />

      <SectionDivider />

      <SectionTitle id="api-keys-management">API Keys Management</SectionTitle>
      <P>Create, list, and revoke API keys programmatically.</P>
      <EndpointBlock method="POST" path="/api/v1/merchant/api-keys" description="Create API key" />
      <EndpointBlock method="GET" path="/api/v1/merchant/api-keys" description="List all API keys" />
      <EndpointBlock method="DELETE" path="/api/v1/merchant/api-keys/{id}" description="Revoke API key" />
      <CodeBlock
        code={`# List all API keys
curl https://api.mycrypto.co.in/api/v1/merchant/api-keys \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Revoke a key (immediate effect)
curl -X DELETE https://api.mycrypto.co.in/api/v1/merchant/api-keys/key_p1q2r3s4t5 \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        language="bash"
      />

      <SectionDivider />

      <SectionTitle id="webhook-management">Webhook Management</SectionTitle>
      <P>Full CRUD for webhook endpoints.</P>
      <EndpointBlock method="POST" path="/api/v1/webhooks" description="Register webhook" />
      <EndpointBlock method="GET" path="/api/v1/webhooks" description="List webhooks" />
      <EndpointBlock method="PUT" path="/api/v1/webhooks/{id}" description="Update webhook" />
      <EndpointBlock method="DELETE" path="/api/v1/webhooks/{id}" description="Delete webhook" />
      <EndpointBlock method="POST" path="/api/v1/webhooks/{id}/test" description="Send test event" />
      <CodeBlock
        code={`# Test a webhook endpoint
curl -X POST https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5/test \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
        language="bash"
      />
      <P>
        The test endpoint sends a simulated <InlineCode>payment.confirmed</InlineCode> event
        and reports back the delivery result:
      </P>
      <CodeBlock
        code={`{
  "id": "whk_m1n2o3p4q5",
  "test_event": "payment.confirmed",
  "delivery": {
    "status_code": 200,
    "response_time_ms": 234,
    "success": true
  },
  "message": "Test event delivered successfully."
}`}
        language="json"
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* INTEGRATIONS */}
      {/* ============================================================ */}

      <SectionTitle id="wordpress-woocommerce">WordPress / WooCommerce</SectionTitle>
      <P>
        Accept crypto payments on your WooCommerce store with the official plugin.
      </P>

      <SubSection id="wp-prereqs">Prerequisites</SubSection>
      <ul className="list-disc list-inside text-sm text-dark-200 space-y-1 mb-4 ml-2">
        <li>WordPress 5.8+, WooCommerce 6.0+, PHP 7.4+</li>
        <li>SSL certificate (HTTPS)</li>
        <li>A MyCryptoCoin merchant account</li>
      </ul>

      <SubSection id="wp-install">Step 1: Install the Plugin</SubSection>
      <TabGroup
        tabs={[
          {
            label: "WordPress Directory",
            content: (
              <div className="text-sm text-dark-200 space-y-2">
                <p>1. Go to <strong className="text-dark-100">Plugins &gt; Add New</strong></p>
                <p>2. Search for <strong className="text-dark-100">"MyCryptoCoin Payments"</strong></p>
                <p>3. Click <strong className="text-dark-100">Install Now</strong>, then <strong className="text-dark-100">Activate</strong></p>
              </div>
            ),
          },
          {
            label: "Manual Upload",
            content: (
              <div className="text-sm text-dark-200 space-y-2">
                <p>1. Download the plugin zip from <a className="text-accent-400" href="https://dashboard.mycrypto.co.in/integrations/wordpress">dashboard</a></p>
                <p>2. Go to <strong className="text-dark-100">Plugins &gt; Add New &gt; Upload Plugin</strong></p>
                <p>3. Choose the zip file and click <strong className="text-dark-100">Install Now</strong>, then <strong className="text-dark-100">Activate</strong></p>
              </div>
            ),
          },
          {
            label: "FTP",
            content: (
              <div className="text-sm text-dark-200 space-y-2">
                <p>1. Upload <InlineCode>mycryptocoin-payments</InlineCode> folder to <InlineCode>/wp-content/plugins/</InlineCode></p>
                <p>2. Activate in <strong className="text-dark-100">Plugins</strong> admin page</p>
              </div>
            ),
          },
        ]}
      />

      <SubSection id="wp-configure">Step 2: Configure</SubSection>
      <P>
        Go to <strong className="text-dark-100">WooCommerce &gt; Settings &gt; Payments &gt; MyCryptoCoin</strong>.
        Enter your API key and webhook secret.
      </P>
      <SimpleTable
        headers={["Setting", "Value"]}
        rows={[
          ["Enable/Disable", "Check \"Enable MyCryptoCoin Payments\""],
          ["Title", "\"Pay with Crypto\" (shown at checkout)"],
          ["API Key", "Paste your mcc_live_ or mcc_test_ key"],
          ["Webhook Secret", "From MyCryptoCoin dashboard"],
          ["Mode", "Test for development, Live for production"],
        ]}
      />

      <SubSection id="wp-webhook">Step 3: Configure Webhook</SubSection>
      <P>
        The plugin creates an endpoint at: <InlineCode>https://yoursite.com/?wc-api=mycryptocoin_webhook</InlineCode>.
        Click <strong className="text-dark-100">Register Webhook</strong> in the plugin settings
        to auto-register, or add it manually in the MyCryptoCoin dashboard.
      </P>

      <SubSection id="wp-hooks">Developer Hooks</SubSection>
      <CodeBlock
        code={`// Modify the crypto list shown at checkout
add_filter('mycryptocoin_available_cryptos', function($cryptos) {
    return ['BTC', 'USDT'];
});

// Add custom metadata to the payment
add_filter('mycryptocoin_payment_metadata', function($metadata, $order) {
    $metadata['customer_name'] = $order->get_billing_first_name();
    return $metadata;
}, 10, 2);

// Run code after a payment is confirmed
add_action('mycryptocoin_payment_confirmed', function($order, $payment_data) {
    error_log("Payment confirmed for order #" . $order->get_id());
}, 10, 2);`}
        language="php"
      />

      <SectionDivider />

      {/* REST API */}
      <SectionTitle id="rest-api">REST API</SectionTitle>
      <P>
        The MyCryptoCoin REST API is the foundation for all integrations.
        All endpoints are prefixed with <InlineCode>/api/v1</InlineCode>.
      </P>
      <SimpleTable
        headers={["Base URL", "Environment"]}
        rows={[
          ["https://api.mycrypto.co.in/api/v1", "Production"],
          ["https://sandbox.api.mycrypto.co.in/api/v1", "Sandbox / Test"],
        ]}
      />
      <P>
        All requests must include authentication via <InlineCode>X-API-Key</InlineCode> or
        <InlineCode>Authorization: Bearer</InlineCode> header. All request and response bodies
        are JSON. Rate limits are enforced at 100 requests/minute for authenticated endpoints.
      </P>

      <SubSection id="rest-rate-limits">Rate Limits</SubSection>
      <SimpleTable
        headers={["Tier", "Limit", "Scope"]}
        rows={[
          ["Auth endpoints (login, register)", "5 req/min", "Per IP"],
          ["All /auth/* routes", "20 req/min", "Per IP"],
          ["Authenticated endpoints", "100 req/min", "Per API key / merchant"],
        ]}
      />
      <P>Rate limit headers are included in every response:</P>
      <SimpleTable
        headers={["Header", "Description"]}
        rows={[
          ["X-RateLimit-Limit", "Maximum requests per window"],
          ["X-RateLimit-Remaining", "Requests remaining"],
          ["X-RateLimit-Reset", "Unix timestamp when window resets"],
        ]}
      />

      <SubSection id="rest-errors">Error Format</SubSection>
      <CodeBlock
        code={`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "amount", "message": "Amount must be a valid decimal number" }
    ]
  }
}`}
        language="json"
      />

      <SectionDivider />

      {/* JAVASCRIPT SDK */}
      <SectionTitle id="javascript-sdk">JavaScript SDK</SectionTitle>
      <P>Full-featured Node.js client with error handling and type safety.</P>
      <CodeBlock
        code={`npm install @mycryptocoin/sdk`}
        language="bash"
        title="Install"
      />
      <CodeBlock
        code={`const API_BASE = process.env.MCC_API_BASE || 'https://api.mycrypto.co.in/api/v1';
const API_KEY = process.env.MCC_API_KEY;

async function mccRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(\`\${API_BASE}\${path}\`, options);
  const data = await response.json();

  if (!response.ok) {
    const err = new Error(\`MCC API Error: \${data.error.message}\`);
    err.code = data.error.code;
    err.status = response.status;
    err.requestId = response.headers.get('X-Request-Id');
    throw err;
  }
  return data;
}

// Create payment
const payment = await mccRequest('POST', '/payments/create', {
  crypto: 'USDT_TRC20',
  amount: '50.00',
  currency: 'USD',
  metadata: { order_id: 'ORD-001' },
});

// Check wallet balance
const wallets = await mccRequest('GET', '/wallets');

// Process withdrawal
const withdrawal = await mccRequest('POST', '/wallets/USDT_TRC20/withdraw', {
  amount: '100.00',
  address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
});`}
        language="javascript"
        title="mcc-client.js"
      />

      <SubSection id="js-webhook-handler">Webhook Handler (Express)</SubSection>
      <CodeBlock
        code={`const express = require('express');
const crypto = require('crypto');
const app = express();

const WEBHOOK_SECRET = process.env.MCC_WEBHOOK_SECRET;

app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-mcc-signature'];
    const body = req.body.toString();

    // Verify HMAC-SHA256 signature
    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.confirmed':
        console.log(\`Payment \${event.data.id} confirmed!\`);
        // Fulfill the order
        break;
      case 'payment.failed':
        console.log(\`Payment \${event.data.id} failed\`);
        break;
    }

    res.status(200).json({ received: true });
  }
);

app.listen(3000);`}
        language="javascript"
      />

      <SectionDivider />

      {/* PYTHON SDK */}
      <SectionTitle id="python-sdk">Python SDK</SectionTitle>
      <P>Full Python client with Flask webhook handler.</P>
      <CodeBlock
        code={`pip install mycryptocoin`}
        language="bash"
        title="Install"
      />
      <CodeBlock
        code={`import os
import requests

class MCCClient:
    def __init__(self, api_key=None, base_url=None):
        self.api_key = api_key or os.environ['MCC_API_KEY']
        self.base_url = base_url or 'https://api.mycrypto.co.in/api/v1'
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json',
        })

    def _request(self, method, path, json=None, params=None):
        response = self.session.request(
            method, f'{self.base_url}{path}', json=json, params=params
        )
        data = response.json()
        if not response.ok:
            raise Exception(f"MCC Error: {data['error']['message']}")
        return data

    def create_payment(self, amount, currency, crypto, **kwargs):
        body = {'amount': amount, 'currency': currency, 'crypto': crypto}
        body.update(kwargs)
        return self._request('POST', '/payments/create', json=body)

    def get_wallets(self):
        return self._request('GET', '/wallets')

    def create_withdrawal(self, crypto, amount, address, memo=None):
        body = {'amount': amount, 'address': address}
        if memo: body['memo'] = memo
        return self._request('POST', f'/wallets/{crypto}/withdraw', json=body)

# Usage
mcc = MCCClient()
payment = mcc.create_payment('50.00', 'USD', 'USDT_TRC20',
    metadata={'order_id': 'ORD-001'})
print(payment['checkout_url'])`}
        language="python"
        title="mcc_client.py"
      />

      <SubSection id="py-webhook">Webhook Handler (Flask)</SubSection>
      <CodeBlock
        code={`import hmac, hashlib, json, os
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = os.environ['MCC_WEBHOOK_SECRET']

@app.route('/webhooks/mycryptocoin', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-MCC-Signature', '')
    body = request.get_data(as_text=True)

    expected = hmac.new(
        WEBHOOK_SECRET.encode(), body.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return jsonify({'error': 'Invalid signature'}), 401

    event = json.loads(body)
    if event['event'] == 'payment.confirmed':
        print(f"Payment {event['data']['id']} confirmed!")
        # Fulfill order

    return jsonify({'received': True}), 200`}
        language="python"
      />

      <SectionDivider />

      {/* PHP SDK */}
      <SectionTitle id="php-sdk">PHP SDK</SectionTitle>
      <P>Production-ready PHP client using cURL.</P>
      <CodeBlock
        code={`composer require mycryptocoin/sdk`}
        language="bash"
        title="Install"
      />
      <CodeBlock
        code={`<?php
class MccClient {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey = null, $baseUrl = null) {
        $this->apiKey = $apiKey ?: getenv('MCC_API_KEY');
        $this->baseUrl = $baseUrl ?: 'https://api.mycrypto.co.in/api/v1';
    }

    private function request($method, $path, $body = null) {
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey,
            'Content-Type: application/json',
        ]);
        if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function createPayment($amount, $currency, $crypto, $options = []) {
        return $this->request('POST', '/payments/create',
            array_merge(compact('amount', 'currency', 'crypto'), $options));
    }

    public function getWallets() {
        return $this->request('GET', '/wallets');
    }

    public function createWithdrawal($crypto, $amount, $address) {
        return $this->request('POST', "/wallets/$crypto/withdraw",
            compact('amount', 'address'));
    }
}

// Usage
$mcc = new MccClient();
$payment = $mcc->createPayment('50.00', 'USD', 'USDT_TRC20', [
    'metadata' => ['order_id' => 'ORD-001'],
]);
echo $payment['checkout_url'];`}
        language="php"
        title="MccClient.php"
      />

      <SubSection id="php-webhook">Webhook Handler</SubSection>
      <CodeBlock
        code={`<?php
$webhookSecret = getenv('MCC_WEBHOOK_SECRET');
$body = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_MCC_SIGNATURE'] ?? '';

$expected = hash_hmac('sha256', $body, $webhookSecret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$event = json_decode($body, true);

if ($event['event'] === 'payment.confirmed') {
    $orderId = $event['data']['metadata']['order_id'] ?? null;
    error_log("Payment confirmed for order $orderId");
    // Fulfill order
}

http_response_code(200);
echo json_encode(['received' => true]);`}
        language="php"
      />

      <SectionDivider />

      {/* RUBY SDK */}
      <SectionTitle id="ruby-sdk">Ruby SDK</SectionTitle>
      <P>Ruby client with webhook verification.</P>
      <CodeBlock
        code={`gem install mycryptocoin`}
        language="bash"
        title="Install"
      />
      <CodeBlock
        code={`require 'net/http'
require 'json'
require 'uri'

class MccClient
  BASE_URL = ENV['MCC_API_BASE'] || 'https://api.mycrypto.co.in/api/v1'

  def initialize(api_key: ENV['MCC_API_KEY'])
    @api_key = api_key
  end

  def request(method, path, body: nil)
    uri = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = case method
          when :get then Net::HTTP::Get.new(uri)
          when :post then Net::HTTP::Post.new(uri)
          when :put then Net::HTTP::Put.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          end

    req['X-API-Key'] = @api_key
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)
    JSON.parse(response.body)
  end

  def create_payment(amount:, currency:, crypto:, **opts)
    request(:post, '/payments/create',
      body: { amount: amount, currency: currency, crypto: crypto }.merge(opts))
  end

  def get_wallets
    request(:get, '/wallets')
  end

  def create_withdrawal(crypto:, amount:, address:, memo: nil)
    body = { amount: amount, address: address }
    body[:memo] = memo if memo
    request(:post, "/wallets/#{crypto}/withdraw", body: body)
  end
end

# Usage
mcc = MccClient.new
payment = mcc.create_payment(
  amount: '50.00', currency: 'USD', crypto: 'USDT_TRC20',
  metadata: { order_id: 'ORD-001' }
)
puts payment['checkout_url']`}
        language="ruby"
        title="mcc_client.rb"
      />

      <SubSection id="ruby-webhook">Webhook Handler (Sinatra)</SubSection>
      <CodeBlock
        code={`require 'sinatra'
require 'openssl'
require 'json'

WEBHOOK_SECRET = ENV['MCC_WEBHOOK_SECRET']

post '/webhooks/mycryptocoin' do
  body = request.body.read
  signature = request.env['HTTP_X_MCC_SIGNATURE'] || ''

  expected = OpenSSL::HMAC.hexdigest('SHA256', WEBHOOK_SECRET, body)

  unless Rack::Utils.secure_compare(expected, signature)
    halt 401, { error: 'Invalid signature' }.to_json
  end

  event = JSON.parse(body)
  case event['event']
  when 'payment.confirmed'
    puts "Payment #{event['data']['id']} confirmed!"
    # Fulfill order
  end

  status 200
  { received: true }.to_json
end`}
        language="ruby"
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* ADMIN */}
      {/* ============================================================ */}

      <SectionTitle id="admin-dashboard">Admin Dashboard</SectionTitle>
      <P>
        The admin panel at <InlineCode>admin.mycrypto.co.in</InlineCode> provides full
        platform management. Only users with <InlineCode>ADMIN</InlineCode> or
        <InlineCode>SUPER_ADMIN</InlineCode> roles can access admin endpoints.
      </P>
      <SimpleTable
        headers={["Feature", "Description"]}
        rows={[
          ["Overview", "Real-time payment volume, active merchants, system health"],
          ["Merchants", "View, approve, suspend, and manage merchant accounts"],
          ["Payments", "Search, filter, and view all payments across merchants"],
          ["Withdrawals", "Review and approve pending withdrawals"],
          ["Analytics", "Revenue charts, conversion rates, crypto distribution"],
          ["System", "Rate limits, webhook health, blockchain node status"],
        ]}
      />

      <SectionDivider />

      <SectionTitle id="merchant-management">Merchant Management</SectionTitle>
      <P>Admin endpoints for managing merchant accounts.</P>
      <EndpointBlock method="GET" path="/api/v1/admin/merchants" description="List all merchants" />
      <EndpointBlock method="GET" path="/api/v1/admin/merchants/{id}" description="Get merchant details" />
      <EndpointBlock method="PUT" path="/api/v1/admin/merchants/{id}/status" description="Activate/deactivate" />
      <P>
        Admin can view merchant profiles, payment history, API key usage, and webhook
        delivery logs. Merchants can be deactivated if fraud is detected.
      </P>

      <SectionDivider />

      <SectionTitle id="withdrawal-approvals">Withdrawal Approvals</SectionTitle>
      <P>
        Large withdrawals may require admin approval. The threshold is configurable
        per merchant or globally.
      </P>
      <EndpointBlock method="GET" path="/api/v1/admin/withdrawals/pending" description="List pending approvals" />
      <EndpointBlock method="POST" path="/api/v1/admin/withdrawals/{id}/approve" description="Approve withdrawal" />
      <EndpointBlock method="POST" path="/api/v1/admin/withdrawals/{id}/reject" description="Reject withdrawal" />

      <SectionDivider />

      <SectionTitle id="fraud-detection">Fraud Detection</SectionTitle>
      <P>
        MyCryptoCoin includes automated fraud detection that monitors for:
      </P>
      <ul className="list-disc list-inside text-sm text-dark-200 space-y-1 mb-4 ml-2">
        <li>Unusual payment patterns (volume spikes, many small payments)</li>
        <li>Multiple failed payments from the same merchant</li>
        <li>Withdrawal attempts to blacklisted addresses (OFAC, known scam addresses)</li>
        <li>API key usage from suspicious IP addresses or geolocations</li>
        <li>Rapid creation and expiry of payments (possible address harvesting)</li>
      </ul>
      <P>
        Flagged activity is surfaced in the admin dashboard with risk scores. Merchants can be
        placed in manual review mode where all withdrawals require admin approval.
      </P>

      <SectionDivider />

      <SectionTitle id="whatsapp-admin">WhatsApp Admin</SectionTitle>
      <P>
        Admin panel for managing WhatsApp integration: message templates, delivery rates,
        OTP statistics, and failed delivery logs.
      </P>
      <SimpleTable
        headers={["Metric", "Description"]}
        rows={[
          ["Delivery rate", "Percentage of OTPs successfully delivered"],
          ["Avg delivery time", "Time from request to WhatsApp delivery"],
          ["Failed deliveries", "Messages that could not be delivered"],
          ["Template status", "Approval status of WhatsApp message templates"],
        ]}
      />

      <SectionDivider />

      {/* ============================================================ */}
      {/* SECURITY */}
      {/* ============================================================ */}

      <SectionTitle id="webhook-signatures">Webhook Signatures</SectionTitle>
      <P>
        Every webhook delivery is signed with HMAC-SHA256. The signature is included in the
        <InlineCode>X-MCC-Signature</InlineCode> header. You must verify this signature
        before processing any webhook event.
      </P>
      <P>
        The signature scheme:
      </P>
      <CodeBlock
        code={`Signature = HMAC-SHA256(webhook_secret, raw_request_body)
Header: X-MCC-Signature: <hex_digest>`}
        language="bash"
        title="Signature scheme"
      />

      <SectionDivider />

      <SectionTitle id="hmac-verification">HMAC Verification</SectionTitle>
      <P>
        Verification code in 5 languages. Always use constant-time comparison to prevent
        timing attacks.
      </P>
      <CodeBlock
        tabs={[
          {
            label: "Node.js",
            language: "javascript",
            code: `const crypto = require('crypto');

function verifyWebhook(signature, body, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}`,
          },
          {
            label: "Python",
            language: "python",
            code: `import hmac
import hashlib

def verify_webhook(signature, body, secret):
    expected = hmac.new(
        secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)`,
          },
          {
            label: "PHP",
            language: "php",
            code: `function verifyWebhook($signature, $body, $secret) {
    $expected = hash_hmac('sha256', $body, $secret);
    return hash_equals($expected, $signature);
}`,
          },
          {
            label: "Ruby",
            language: "ruby",
            code: `require 'openssl'

def verify_webhook(signature, body, secret)
  expected = OpenSSL::HMAC.hexdigest('SHA256', secret, body)
  Rack::Utils.secure_compare(expected, signature)
end`,
          },
          {
            label: "Go",
            language: "go",
            code: `import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func verifyWebhook(signature, body, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write([]byte(body))
    expected := hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(signature), []byte(expected))
}`,
          },
        ]}
      />

      <InfoBox type="danger" title="Security">
        Never use standard string comparison (=== or ==) for signature verification.
        It leaks timing information. Always use constant-time comparison functions.
      </InfoBox>

      <SectionDivider />

      <SectionTitle id="2fa-setup">2FA Setup</SectionTitle>
      <P>
        MyCryptoCoin uses WhatsApp OTP as a second factor for sensitive operations.
        2FA is automatically enabled for all accounts through WhatsApp verification.
      </P>

      <SubSection id="2fa-when-required">When OTP is Required</SubSection>
      <SimpleTable
        headers={["Action", "OTP Required"]}
        rows={[
          ["Account registration", "Yes (WhatsApp verification)"],
          ["Password reset", "Yes"],
          ["Configuring auto-withdrawal address", "Yes"],
          ["Manual withdrawal", "Yes"],
          ["Changing WhatsApp number", "Yes"],
          ["Deleting account", "Yes"],
          ["Regular API calls (payments, etc.)", "No"],
        ]}
      />

      <SubSection id="2fa-why-whatsapp">Why WhatsApp</SubSection>
      <ul className="list-disc list-inside text-sm text-dark-200 space-y-1 mb-4 ml-2">
        <li>End-to-end encrypted delivery</li>
        <li>No SIM swap risk (unlike SMS, tied to device + number)</li>
        <li>Instant delivery, no carrier delays</li>
        <li>Widely used in target markets</li>
      </ul>

      <SectionDivider />

      <SectionTitle id="ip-whitelisting">IP Whitelisting</SectionTitle>
      <P>
        Restrict API access to specific IP addresses or CIDR ranges.
        Configure in <strong className="text-dark-100">Dashboard &gt; Settings &gt; Security &gt; IP Whitelist</strong>.
      </P>
      <CodeBlock
        code={`curl -X PUT https://api.mycrypto.co.in/api/v1/merchant/profile \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ip_whitelist": ["203.0.113.0/24", "198.51.100.42"]
  }'`}
        language="bash"
      />
      <InfoBox type="info">
        IP whitelisting applies to API key authentication only. Dashboard access (Bearer token)
        is not affected. An empty whitelist means all IPs are allowed (default).
      </InfoBox>

      <SectionDivider />

      <SectionTitle id="encryption">Encryption</SectionTitle>
      <P>
        MyCryptoCoin encrypts all data in transit and at rest.
      </P>

      <SubSection id="encryption-transit">In Transit</SubSection>
      <P>
        All communication uses TLS 1.3 (TLS 1.2 fallback). Only AEAD ciphers
        (AES-256-GCM, ChaCha20-Poly1305). HSTS enabled. HTTP requests are rejected outright.
      </P>

      <SubSection id="encryption-rest">At Rest</SubSection>
      <SimpleTable
        headers={["Data", "Encryption"]}
        rows={[
          ["API keys", "AES-256-GCM with per-key envelope encryption"],
          ["Webhook secrets", "AES-256-GCM"],
          ["Merchant passwords", "bcrypt with cost factor 12"],
          ["Private keys (HD wallets)", "AES-256-GCM with HSM-protected master keys"],
          ["Personal information", "AES-256-GCM with field-level encryption"],
          ["Database backups", "AES-256 encrypted at storage layer"],
        ]}
      />

      <SubSection id="hd-wallet">HD Wallet Architecture</SubSection>
      <P>
        MyCryptoCoin uses Hierarchical Deterministic (HD) wallets based on BIP-32/39/44.
        Each merchant gets a unique key derivation path. Every payment gets a fresh address.
        Master seeds never leave the HSM.
      </P>
      <div className="ascii-diagram my-4">
{`Master Seed (HSM-protected)
  |
  +-- Merchant A (m/44'/0'/0')
  |     +-- Payment 1 (m/44'/0'/0'/0/0)
  |     +-- Payment 2 (m/44'/0'/0'/0/1)
  |     +-- Payment 3 (m/44'/0'/0'/0/2)
  |
  +-- Merchant B (m/44'/0'/1')
        +-- Payment 1 (m/44'/0'/1'/0/0)
        +-- Payment 2 (m/44'/0'/1'/0/1)`}
      </div>

      <SimpleTable
        headers={["Wallet", "Purpose", "Funds"]}
        rows={[
          ["Hot wallet", "Day-to-day withdrawals", "~5-10%"],
          ["Warm wallet", "Replenishes hot wallet", "~15-20%"],
          ["Cold storage", "Long-term secure storage", "~70-80%"],
        ]}
      />

      <SectionDivider />

      {/* FOOTER */}
      <div className="text-center py-12 border-t border-dark-700/30">
        <p className="text-dark-400 text-sm">
          MyCryptoCoin Documentation &middot; API v1.0
        </p>
        <p className="text-dark-500 text-xs mt-2">
          Need help?{" "}
          <a href="mailto:developers@mycrypto.co.in" className="text-accent-400 hover:text-accent-300">
            developers@mycrypto.co.in
          </a>
          {" "}&middot;{" "}
          <a href="https://status.mycrypto.co.in" className="text-accent-400 hover:text-accent-300">
            Status Page
          </a>
        </p>
      </div>
    </div>
  );
}
