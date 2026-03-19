'use client';

import React, { useState } from 'react';

const sdkExamples = {
  'Create Payment': {
    php: `<?php
$ch = curl_init('https://api.mycrypto.co.in/v1/payments');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'amount' => 100.00,
    'currency' => 'USD',
    'crypto' => 'BTC',
    'callback_url' => 'https://yoursite.com/webhook',
    'order_id' => 'ORD-12345',
  ]),
]);
$response = json_decode(curl_exec($ch), true);
echo $response['payment_url'];`,
    ruby: `require 'net/http'
require 'json'

uri = URI('https://api.mycrypto.co.in/v1/payments')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = {
  amount: 100.00,
  currency: 'USD',
  crypto: 'BTC',
  callback_url: 'https://yoursite.com/webhook',
  order_id: 'ORD-12345'
}.to_json

response = http.request(request)
data = JSON.parse(response.body)
puts data['payment_url']`,
    python: `import requests

response = requests.post(
    'https://api.mycrypto.co.in/v1/payments',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'amount': 100.00,
        'currency': 'USD',
        'crypto': 'BTC',
        'callback_url': 'https://yoursite.com/webhook',
        'order_id': 'ORD-12345',
    }
)
data = response.json()
print(data['payment_url'])`,
    javascript: `const response = await fetch('https://api.mycrypto.co.in/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 100.00,
    currency: 'USD',
    crypto: 'BTC',
    callback_url: 'https://yoursite.com/webhook',
    order_id: 'ORD-12345',
  }),
});
const data = await response.json();
console.log(data.payment_url);`,
    curl: `curl -X POST https://api.mycrypto.co.in/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "crypto": "BTC",
    "callback_url": "https://yoursite.com/webhook",
    "order_id": "ORD-12345"
  }'`,
  },
  'Check Status': {
    php: `<?php
$ch = curl_init('https://api.mycrypto.co.in/v1/payments/PAY-12345');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
  ],
]);
$response = json_decode(curl_exec($ch), true);
echo "Status: " . $response['status'];`,
    python: `import requests

response = requests.get(
    'https://api.mycrypto.co.in/v1/payments/PAY-12345',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)
data = response.json()
print(f"Status: {data['status']}")`,
    javascript: `const response = await fetch('https://api.mycrypto.co.in/v1/payments/PAY-12345', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
});
const data = await response.json();
console.log('Status:', data.status);`,
    ruby: `require 'net/http'
uri = URI('https://api.mycrypto.co.in/v1/payments/PAY-12345')
request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
puts JSON.parse(response.body)['status']`,
    curl: `curl https://api.mycrypto.co.in/v1/payments/PAY-12345 \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  'Setup Webhooks': {
    php: `<?php
$ch = curl_init('https://api.mycrypto.co.in/v1/webhooks');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'url' => 'https://yoursite.com/webhook',
    'events' => ['payment.confirmed', 'payment.failed', 'withdrawal.completed'],
    'secret' => 'whsec_your_secret_key',
  ]),
]);
$response = json_decode(curl_exec($ch), true);`,
    python: `import requests

response = requests.post(
    'https://api.mycrypto.co.in/v1/webhooks',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'url': 'https://yoursite.com/webhook',
        'events': ['payment.confirmed', 'payment.failed', 'withdrawal.completed'],
        'secret': 'whsec_your_secret_key',
    }
)`,
    javascript: `const response = await fetch('https://api.mycrypto.co.in/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://yoursite.com/webhook',
    events: ['payment.confirmed', 'payment.failed', 'withdrawal.completed'],
    secret: 'whsec_your_secret_key',
  }),
});`,
    ruby: `require 'net/http'
uri = URI('https://api.mycrypto.co.in/v1/webhooks')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = { url: 'https://yoursite.com/webhook', events: ['payment.confirmed'], secret: 'whsec_your_secret_key' }.to_json
Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }`,
    curl: `curl -X POST https://api.mycrypto.co.in/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yoursite.com/webhook",
    "events": ["payment.confirmed", "payment.failed"],
    "secret": "whsec_your_secret_key"
  }'`,
  },
  'Process Withdrawal': {
    php: `<?php
$ch = curl_init('https://api.mycrypto.co.in/v1/withdrawals/create');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'crypto' => 'BTC',
    'amount' => '0.5',
    'address' => 'bc1q...destination_address',
    'network' => 'bitcoin',
  ]),
]);
$response = json_decode(curl_exec($ch), true);`,
    python: `import requests

response = requests.post(
    'https://api.mycrypto.co.in/v1/withdrawals/create',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'crypto': 'BTC',
        'amount': '0.5',
        'address': 'bc1q...destination_address',
        'network': 'bitcoin',
    }
)`,
    javascript: `const response = await fetch('https://api.mycrypto.co.in/v1/withdrawals/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    crypto: 'BTC',
    amount: '0.5',
    address: 'bc1q...destination_address',
    network: 'bitcoin',
  }),
});`,
    ruby: `require 'net/http'
uri = URI('https://api.mycrypto.co.in/v1/withdrawals/create')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_API_KEY'
request['Content-Type'] = 'application/json'
request.body = { crypto: 'BTC', amount: '0.5', address: 'bc1q...destination', network: 'bitcoin' }.to_json
Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }`,
    curl: `curl -X POST https://api.mycrypto.co.in/v1/withdrawals/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"crypto":"BTC","amount":"0.5","address":"bc1q...","network":"bitcoin"}'`,
  },
  'Verify Webhook': {
    php: `<?php
function verifyWebhookSignature($payload, $signature, $secret) {
    $computed = hash_hmac('sha256', $payload, $secret);
    return hash_equals($computed, $signature);
}

$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_MYCRYPTOCOIN_SIGNATURE'] ?? '';
$secret = 'whsec_your_secret_key';

if (verifyWebhookSignature($payload, $signature, $secret)) {
    $event = json_decode($payload, true);
    // Process event
    http_response_code(200);
} else {
    http_response_code(401);
}`,
    python: `import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    computed = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(computed, signature)

# In your webhook handler:
payload = request.get_data()
signature = request.headers.get('X-MyCryptoCoin-Signature', '')
secret = 'whsec_your_secret_key'

if verify_webhook(payload, signature, secret):
    event = request.get_json()
    # Process event
    return '', 200
return '', 401`,
    javascript: `import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

// Express handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-mycryptocoin-signature'];
  if (verifyWebhook(JSON.stringify(req.body), signature, 'whsec_your_secret_key')) {
    // Process event
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});`,
    ruby: `require 'openssl'

def verify_webhook(payload, signature, secret)
  computed = OpenSSL::HMAC.hexdigest('SHA256', secret, payload)
  Rack::Utils.secure_compare(computed, signature)
end

# In your controller:
payload = request.body.read
signature = request.headers['X-MyCryptoCoin-Signature']

if verify_webhook(payload, signature, 'whsec_your_secret_key')
  event = JSON.parse(payload)
  head :ok
else
  head :unauthorized
end`,
    curl: `# Webhook signatures are verified server-side.
# Test your webhook endpoint:
curl -X POST https://yoursite.com/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-MyCryptoCoin-Signature: test_signature" \\
  -d '{"event":"payment.confirmed","payment_id":"PAY-12345"}'`,
  },
};

const languages = ['php', 'python', 'javascript', 'ruby', 'curl'] as const;
type Language = typeof languages[number];

const apiKeys = [
  { name: 'Production Key', key: 'mcc_live_...a4f2', created: 'Mar 1, 2026', status: 'active' },
  { name: 'Test Key', key: 'mcc_test_...b7e1', created: 'Feb 15, 2026', status: 'active' },
];

export default function IntegrationPage() {
  const [activeExample, setActiveExample] = useState<string>('Create Payment');
  const [activeLang, setActiveLang] = useState<Language>('javascript');

  const examples = sdkExamples[activeExample as keyof typeof sdkExamples];

  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.08)]">
          <h4 className="text-lg font-bold text-white">API Keys</h4>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all">
            Generate New Key
          </button>
        </div>
        <div className="divide-y divide-[rgba(99,102,241,0.05)]">
          {apiKeys.map((key, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div>
                <h5 className="text-sm font-semibold text-slate-200">{key.name}</h5>
                <span className="text-xs text-slate-500 font-mono">{key.key}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{key.created}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400">{key.status}</span>
                <button className="px-3 py-1 rounded-lg border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/5 transition-colors">
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SDK Examples */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-5 border-b border-[rgba(99,102,241,0.08)]">
          <h4 className="text-lg font-bold text-white">SDK Integration Examples</h4>
        </div>
        <div className="flex flex-col lg:flex-row">
          {/* Left: Example Selector */}
          <div className="lg:w-56 border-b lg:border-b-0 lg:border-r border-[rgba(99,102,241,0.08)] p-3">
            {Object.keys(sdkExamples).map((example) => (
              <button
                key={example}
                onClick={() => setActiveExample(example)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
                  activeExample === example
                    ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {example}
              </button>
            ))}
          </div>

          {/* Right: Code */}
          <div className="flex-1 p-5">
            {/* Language tabs */}
            <div className="flex gap-1 mb-4 bg-[#1a1d2e]/50 rounded-xl p-1 overflow-x-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeLang === lang
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>

            {/* Code block */}
            <div className="relative">
              <pre className="bg-[#0a0d16] rounded-xl p-5 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed border border-[rgba(99,102,241,0.08)]">
                <code>{examples?.[activeLang as keyof typeof examples] || '// No example available'}</code>
              </pre>
              <button
                onClick={() => {
                  const code = examples?.[activeLang as keyof typeof examples] || '';
                  navigator.clipboard?.writeText(code);
                }}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 text-xs hover:text-white hover:bg-white/10 transition-all border border-[rgba(99,102,241,0.1)]"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
