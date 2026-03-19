# SDK Examples

Copy-paste ready code examples for integrating MyCryptoCoin in JavaScript/Node.js, Python, PHP, Ruby, and cURL.

---

## Table of Contents

- [JavaScript / Node.js](#javascript--nodejs)
- [Python](#python)
- [PHP](#php)
- [Ruby](#ruby)
- [cURL](#curl)

---

## JavaScript / Node.js

### Setup

```javascript
// mcc-client.js
const API_BASE = process.env.MCC_API_BASE || 'https://api.mycrypto.co.in/api/v1';
const API_KEY = process.env.MCC_API_KEY;

if (!API_KEY) {
  throw new Error('MCC_API_KEY environment variable is not set');
}

async function mccRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const requestId = response.headers.get('X-Request-Id');
    const err = new Error(`MCC API Error: ${data.error.message}`);
    err.code = data.error.code;
    err.status = response.status;
    err.requestId = requestId;
    err.details = data.error.details;
    throw err;
  }

  return data;
}

module.exports = { mccRequest };
```

### Create a Payment

```javascript
const { mccRequest } = require('./mcc-client');

async function createPayment(orderId, amount, currency, crypto, customerEmail) {
  try {
    const payment = await mccRequest('POST', '/payments/create', {
      amount,
      currency,
      crypto,
      description: `Order #${orderId}`,
      metadata: {
        order_id: orderId,
        customer_email: customerEmail,
      },
      callbackUrl: 'https://yoursite.com/webhooks/mycryptocoin',
      redirectUrl: `https://yoursite.com/orders/${orderId}/complete`,
      expiryMinutes: 30,
    });

    console.log('Payment created:', payment.id);
    console.log('Checkout URL:', payment.checkout_url);
    console.log('Deposit address:', payment.deposit_address);
    console.log('Amount:', payment.crypto_amount, payment.crypto);
    console.log('Expires at:', payment.expires_at);

    return payment;
  } catch (error) {
    if (error.code === 'invalid_request') {
      console.error('Invalid payment data:', error.details);
    } else if (error.status === 429) {
      console.error('Rate limited. Retry after:', error.details?.retry_after, 'seconds');
    } else {
      console.error('Payment creation failed:', error.message);
      console.error('Request ID:', error.requestId);
    }
    throw error;
  }
}

// Usage
createPayment('ORD-12345', 99.99, 'USD', 'USDT', 'buyer@example.com');
```

### Check Payment Status

```javascript
const { mccRequest } = require('./mcc-client');

async function checkPayment(paymentId, txHash) {
  try {
    const result = await mccRequest('POST', `/payments/${paymentId}/verify`, { txHash });

    if (result.verified) {
      console.log(`Payment ${paymentId} is CONFIRMED`);
      console.log('TX Hash:', result.tx_hash);
      console.log('Confirmations:', result.confirmations);
      return { confirmed: true, txHash: result.tx_hash };
    }

    console.log(`Payment ${paymentId}: ${result.status}`);
    console.log(`Confirmations: ${result.confirmations}/${result.required_confirmations}`);
    return { confirmed: false, status: result.status };
  } catch (error) {
    if (error.code === 'not_found') {
      console.error('Payment not found:', paymentId);
    } else {
      console.error('Verification failed:', error.message);
    }
    throw error;
  }
}

// Usage
checkPayment('pay_1a2b3c4d5e6f');
```

### Handle Webhooks (Express)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

const WEBHOOK_SECRET = process.env.MCC_WEBHOOK_SECRET;

function verifySignature(req) {
  const signature = req.headers['x-mcc-signature'];
  const body = req.body.toString();

  if (!signature || !body) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Track processed delivery IDs (use Redis or a database in production)
const processedDeliveries = new Set();

app.post('/webhooks/mycryptocoin',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // Step 1: Verify signature
    if (!verifySignature(req)) {
      console.error('Webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Step 2: Parse and deduplicate
    const deliveryId = req.headers['x-mcc-delivery-id'];
    if (processedDeliveries.has(deliveryId)) {
      return res.status(200).json({ received: true });
    }

    const event = JSON.parse(req.body.toString());
    console.log(`Webhook received: ${event.event} (${event.webhookId})`);

    // Step 3: Handle event types
    try {
      switch (event.event) {
        case 'payment.confirming': {
          const { id, metadata, tx_hash } = event.data;
          console.log(`Payment ${id} is confirming. TX: ${tx_hash}`);
          // Update order status in your database
          break;
        }

        case 'payment.confirmed': {
          const { id, metadata, crypto_amount, crypto, net_amount } = event.data;
          console.log(`Payment ${id} confirmed: ${crypto_amount} ${crypto}`);
          // Fulfill the order
          // await fulfillOrder(metadata.order_id);
          break;
        }

        case 'payment.completed': {
          const { id, net_amount, crypto } = event.data;
          console.log(`Payment ${id} completed: ${net_amount} ${crypto} credited`);
          break;
        }

        case 'payment.failed': {
          const { id, metadata } = event.data;
          console.log(`Payment ${id} failed`);
          // Notify customer, cancel order
          break;
        }

        case 'payment.expired': {
          const { id, metadata } = event.data;
          console.log(`Payment ${id} expired`);
          // Release reserved inventory
          break;
        }

        case 'withdrawal.completed': {
          const { id, crypto, net_amount, tx_hash } = event.data;
          console.log(`Withdrawal ${id} completed: ${net_amount} ${crypto}. TX: ${tx_hash}`);
          break;
        }

        case 'withdrawal.failed': {
          const { id, crypto, amount } = event.data;
          console.error(`Withdrawal ${id} failed: ${amount} ${crypto}`);
          // Alert operations team
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      processedDeliveries.add(deliveryId);
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Return 500 so MyCryptoCoin retries
      return res.status(500).json({ error: 'Processing failed' });
    }

    res.status(200).json({ received: true });
  }
);

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Process a Withdrawal

```javascript
const { mccRequest } = require('./mcc-client');

async function withdrawBTC(amount, address) {
  try {
    const withdrawal = await mccRequest('POST', '/wallets/BTC/withdraw', {
      amount: amount,
      address: address,
    });

    console.log('Withdrawal initiated:', withdrawal.id);
    console.log('Amount:', withdrawal.amount, 'BTC');
    console.log('Network fee:', withdrawal.network_fee, 'BTC');
    console.log('Net amount:', withdrawal.net_amount, 'BTC');
    console.log('Status:', withdrawal.status);

    return withdrawal;
  } catch (error) {
    if (error.code === 'insufficient_balance') {
      console.error('Not enough funds:', error.message);
    } else if (error.code === 'invalid_address') {
      console.error('Invalid address:', error.message);
    } else if (error.code === 'below_minimum') {
      console.error('Below minimum:', error.details);
    } else {
      console.error('Withdrawal failed:', error.message);
    }
    throw error;
  }
}

// Usage
withdrawBTC('0.05000000', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
```

---

## Python

### Setup

```python
# mcc_client.py
import os
import requests

API_BASE = os.environ.get('MCC_API_BASE', 'https://api.mycrypto.co.in/api/v1')
API_KEY = os.environ.get('MCC_API_KEY')

if not API_KEY:
    raise EnvironmentError('MCC_API_KEY environment variable is not set')


class MCCError(Exception):
    def __init__(self, code, message, status, request_id, details=None):
        super().__init__(message)
        self.code = code
        self.status = status
        self.request_id = request_id
        self.details = details or {}


class MCCClient:
    def __init__(self, api_key=None, base_url=None):
        self.api_key = api_key or API_KEY
        self.base_url = base_url or API_BASE
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json',
        })

    def _request(self, method, path, json=None, params=None):
        url = f'{self.base_url}{path}'
        response = self.session.request(method, url, json=json, params=params)
        data = response.json()

        if not response.ok:
            error = data.get('error', {})
            request_id = response.headers.get('X-Request-Id')
            raise MCCError(
                code=error.get('code', 'unknown'),
                message=error.get('message', 'Unknown error'),
                status=response.status_code,
                request_id=request_id,
                details=error.get('details'),
            )

        return data

    def create_payment(self, amount, currency, crypto, **kwargs):
        body = {'amount': amount, 'currency': currency, 'crypto': crypto}
        body.update(kwargs)
        return self._request('POST', '/payments/create', json=body)

    def get_payment(self, payment_id):
        return self._request('GET', f'/payments/{payment_id}')

    def verify_payment(self, payment_id, tx_hash):
        return self._request('POST', f'/payments/{payment_id}/verify', json={'txHash': tx_hash})

    def list_payments(self, **filters):
        return self._request('GET', '/payments', params=filters)

    def get_wallets(self):
        return self._request('GET', '/wallets')

    def get_wallet(self, crypto):
        return self._request('GET', f'/wallets/{crypto}')

    def create_withdrawal(self, crypto, amount, address, memo=None):
        body = {'amount': amount, 'address': address}
        if memo:
            body['memo'] = memo
        return self._request('POST', f'/wallets/{crypto}/withdraw', json=body)

    def get_wallet(self, crypto):
        return self._request('GET', f'/wallets/{crypto}')

    def configure_auto_withdraw(self, crypto, enabled, address=None, threshold=None):
        body = {'enabled': enabled}
        if address:
            body['address'] = address
        if threshold:
            body['threshold'] = threshold
        return self._request('PUT', f'/wallets/{crypto}/auto-withdraw', json=body)
```

### Create a Payment

```python
from mcc_client import MCCClient, MCCError

mcc = MCCClient()

try:
    payment = mcc.create_payment(
        amount='99.99',
        currency='USD',
        crypto='USDT_ERC20',
        description='Order #ORD-12345',
        metadata={
            'order_id': 'ORD-12345',
            'customer_email': 'buyer@example.com',
        },
        callbackUrl='https://yoursite.com/webhooks/mycryptocoin',
        redirectUrl='https://yoursite.com/orders/ORD-12345/complete',
        expiryMinutes=30,
    )

    print(f"Payment created: {payment['id']}")
    print(f"Checkout URL: {payment['checkout_url']}")
    print(f"Deposit address: {payment['deposit_address']}")
    print(f"Amount: {payment['crypto_amount']} {payment['crypto']}")
    print(f"Expires at: {payment['expires_at']}")

except MCCError as e:
    if e.code == 'invalid_request':
        print(f"Invalid payment data: {e.details}")
    elif e.status == 429:
        print(f"Rate limited. Retry after: {e.details.get('retry_after')}s")
    else:
        print(f"Error [{e.request_id}]: {e.code} - {e}")
```

### Check Payment Status

```python
from mcc_client import MCCClient, MCCError

mcc = MCCClient()

try:
    result = mcc.verify_payment('pay_1a2b3c4d5e6f', '0xabc123def456789...')

    if result['verified']:
        print(f"Payment CONFIRMED")
        print(f"TX Hash: {result['tx_hash']}")
        print(f"Confirmations: {result['confirmations']}")
    else:
        print(f"Status: {result['status']}")
        print(f"Confirmations: {result['confirmations']}/{result['required_confirmations']}")

except MCCError as e:
    if e.code == 'not_found':
        print(f"Payment not found")
    else:
        print(f"Error: {e}")
```

### Handle Webhooks (Flask)

```python
import hmac
import hashlib
import time
import json
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

WEBHOOK_SECRET = os.environ['MCC_WEBHOOK_SECRET']

# Use Redis or a database in production
processed_deliveries = set()


def verify_signature(req):
    signature = req.headers.get('X-MCC-Signature', '')
    body = req.get_data(as_text=True)

    if not signature or not body:
        return False

    expected = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


@app.route('/webhooks/mycryptocoin', methods=['POST'])
def handle_webhook():
    # Step 1: Verify signature
    if not verify_signature(request):
        return jsonify({'error': 'Invalid signature'}), 401

    # Step 2: Deduplicate using webhookId from payload
    event = json.loads(request.get_data(as_text=True))
    webhook_id = event.get('webhookId', '')
    event_key = f"{webhook_id}:{event.get('timestamp', '')}"
    if event_key in processed_deliveries:
        return jsonify({'received': True}), 200

    # Step 3: Process event
    event_type = event['event']
    data = event['data']

    print(f"Webhook received: {event_type} ({webhook_id})")

    if event_type == 'payment.confirmed':
        order_id = data['metadata'].get('order_id')
        print(f"Payment {data['id']} confirmed for order {order_id}")
        print(f"Amount: {data['crypto_amount']} {data['crypto']}")
        # fulfill_order(order_id)

    elif event_type == 'payment.failed':
        order_id = data['metadata'].get('order_id')
        print(f"Payment {data['id']} failed for order {order_id}")
        # cancel_order(order_id)

    elif event_type == 'payment.expired':
        order_id = data['metadata'].get('order_id')
        print(f"Payment {data['id']} expired for order {order_id}")
        # release_inventory(order_id)

    elif event_type == 'withdrawal.completed':
        print(f"Withdrawal {data['id']} completed: {data['net_amount']} {data['crypto']}")

    elif event_type == 'withdrawal.failed':
        print(f"Withdrawal {data['id']} failed: {data['amount']} {data['crypto']}")

    processed_deliveries.add(event_key)
    return jsonify({'received': True}), 200


if __name__ == '__main__':
    app.run(port=3000)
```

### Process a Withdrawal

```python
from mcc_client import MCCClient, MCCError

mcc = MCCClient()

try:
    withdrawal = mcc.create_withdrawal(
        'BTC',
        '0.05000000',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    )

    print(f"Withdrawal initiated: {withdrawal['id']}")
    print(f"Amount: {withdrawal['amount']} BTC")
    print(f"Network fee: {withdrawal['network_fee']} BTC")
    print(f"Net amount: {withdrawal['net_amount']} BTC")
    print(f"Status: {withdrawal['status']}")

except MCCError as e:
    if e.code == 'insufficient_balance':
        print(f"Not enough funds: {e}")
    elif e.code == 'invalid_address':
        print(f"Invalid address: {e}")
    elif e.code == 'below_minimum':
        print(f"Below minimum: {e.details}")
    else:
        print(f"Error [{e.request_id}]: {e}")
```

---

## PHP

### Setup

```php
<?php
// MccClient.php

class MccError extends Exception {
    public $code;
    public $httpStatus;
    public $requestId;
    public $details;

    public function __construct($code, $message, $httpStatus, $requestId, $details = []) {
        parent::__construct($message);
        $this->code = $code;
        $this->httpStatus = $httpStatus;
        $this->requestId = $requestId;
        $this->details = $details;
    }
}

class MccClient {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey = null, $baseUrl = null) {
        $this->apiKey = $apiKey ?: getenv('MCC_API_KEY');
        $this->baseUrl = $baseUrl ?: (getenv('MCC_API_BASE') ?: 'https://api.mycrypto.co.in/api/v1');

        if (!$this->apiKey) {
            throw new RuntimeException('MCC_API_KEY environment variable is not set');
        }
    }

    private function request($method, $path, $body = null, $params = []) {
        $url = $this->baseUrl . $path;

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $response = curl_exec($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException("cURL error: $error");
        }

        curl_close($ch);

        $headers = substr($response, 0, $headerSize);
        $responseBody = substr($response, $headerSize);
        $data = json_decode($responseBody, true);

        // Extract X-Request-Id from headers
        $requestId = null;
        if (preg_match('/X-Request-Id:\s*(.+)/i', $headers, $matches)) {
            $requestId = trim($matches[1]);
        }

        if ($httpStatus >= 400) {
            $error = $data['error'] ?? [];
            throw new MccError(
                $error['code'] ?? 'unknown',
                $error['message'] ?? 'Unknown error',
                $httpStatus,
                $requestId,
                $error['details'] ?? []
            );
        }

        return $data;
    }

    public function createPayment($amount, $currency, $crypto, $options = []) {
        $body = array_merge([
            'amount' => $amount,
            'currency' => $currency,
            'crypto' => $crypto,
        ], $options);
        return $this->request('POST', '/payments/create', $body);
    }

    public function getPayment($paymentId) {
        return $this->request('GET', "/payments/$paymentId");
    }

    public function verifyPayment($paymentId, $txHash) {
        return $this->request('POST', "/payments/$paymentId/verify", ['txHash' => $txHash]);
    }

    public function listPayments($filters = []) {
        return $this->request('GET', '/payments', null, $filters);
    }

    public function getWallets() {
        return $this->request('GET', '/wallets');
    }

    public function createWithdrawal($crypto, $amount, $address, $options = []) {
        $body = array_merge([
            'amount' => $amount,
            'address' => $address,
        ], $options);
        return $this->request('POST', "/wallets/$crypto/withdraw", $body);
    }
}
```

### Create a Payment

```php
<?php
require_once 'MccClient.php';

$mcc = new MccClient();

try {
    $payment = $mcc->createPayment('99.99', 'USD', 'USDT_ERC20', [
        'description' => 'Order #ORD-12345',
        'metadata' => [
            'order_id' => 'ORD-12345',
            'customer_email' => 'buyer@example.com',
        ],
        'callbackUrl' => 'https://yoursite.com/webhooks/mycryptocoin',
        'redirectUrl' => 'https://yoursite.com/orders/ORD-12345/complete',
        'expiryMinutes' => 30,
    ]);

    echo "Payment created: " . $payment['id'] . "\n";
    echo "Checkout URL: " . $payment['checkout_url'] . "\n";
    echo "Deposit address: " . $payment['deposit_address'] . "\n";
    echo "Amount: " . $payment['crypto_amount'] . " " . $payment['crypto'] . "\n";

    // Redirect customer
    header('Location: ' . $payment['checkout_url']);
    exit;

} catch (MccError $e) {
    if ($e->code === 'invalid_request') {
        echo "Invalid payment data: " . json_encode($e->details) . "\n";
    } else {
        echo "Error [{$e->requestId}]: {$e->code} - {$e->getMessage()}\n";
    }
}
```

### Handle Webhooks (PHP)

```php
<?php
// webhooks/mycryptocoin.php

$webhookSecret = getenv('MCC_WEBHOOK_SECRET');
$body = file_get_contents('php://input');
$headers = getallheaders();

// Normalize header names (some servers lowercase them)
$normalizedHeaders = [];
foreach ($headers as $key => $value) {
    $normalizedHeaders[strtolower($key)] = $value;
}

$signature = $normalizedHeaders['x-mcc-signature'] ?? '';

// Step 1: Verify signature
if (empty($signature) || empty($body)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing signature']);
    exit;
}

$expectedSignature = hash_hmac('sha256', $body, $webhookSecret);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Step 2: Parse event
$event = json_decode($body, true);
$eventType = $event['event'];
$data = $event['data'];

error_log("Webhook received: $eventType ({$event['webhookId']})");

// Step 3: Handle events
switch ($eventType) {
    case 'payment.confirmed':
        $orderId = $data['metadata']['order_id'] ?? null;
        error_log("Payment {$data['id']} confirmed for order $orderId");
        error_log("Amount: {$data['crypto_amount']} {$data['crypto']}");

        // Update your database
        // $db->query("UPDATE orders SET status='paid' WHERE order_id=?", [$orderId]);

        // Fulfill the order
        // fulfillOrder($orderId);
        break;

    case 'payment.failed':
        $orderId = $data['metadata']['order_id'] ?? null;
        error_log("Payment {$data['id']} failed for order $orderId");
        // $db->query("UPDATE orders SET status='failed' WHERE order_id=?", [$orderId]);
        break;

    case 'payment.expired':
        $orderId = $data['metadata']['order_id'] ?? null;
        error_log("Payment {$data['id']} expired for order $orderId");
        // $db->query("UPDATE orders SET status='expired' WHERE order_id=?", [$orderId]);
        break;

    case 'withdrawal.completed':
        error_log("Withdrawal {$data['id']} completed: {$data['net_amount']} {$data['crypto']}");
        break;

    case 'withdrawal.failed':
        error_log("Withdrawal {$data['id']} failed: {$data['amount']} {$data['crypto']}");
        break;

    default:
        error_log("Unhandled event type: $eventType");
}

// Step 4: Respond
http_response_code(200);
echo json_encode(['received' => true]);
```

### Process a Withdrawal

```php
<?php
require_once 'MccClient.php';

$mcc = new MccClient();

try {
    $withdrawal = $mcc->createWithdrawal('BTC', '0.05000000',
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    );

    echo "Withdrawal initiated: " . $withdrawal['id'] . "\n";
    echo "Amount: " . $withdrawal['amount'] . " BTC\n";
    echo "Network fee: " . $withdrawal['network_fee'] . " BTC\n";
    echo "Net amount: " . $withdrawal['net_amount'] . " BTC\n";
    echo "Status: " . $withdrawal['status'] . "\n";

} catch (MccError $e) {
    switch ($e->code) {
        case 'insufficient_balance':
            echo "Not enough funds: " . $e->getMessage() . "\n";
            break;
        case 'invalid_address':
            echo "Invalid address: " . $e->getMessage() . "\n";
            break;
        case 'below_minimum':
            echo "Below minimum: " . json_encode($e->details) . "\n";
            break;
        default:
            echo "Error [{$e->requestId}]: {$e->code} - {$e->getMessage()}\n";
    }
}
```

---

## Ruby

### Setup

```ruby
# mcc_client.rb
require 'net/http'
require 'json'
require 'uri'

class MCCError < StandardError
  attr_reader :code, :http_status, :request_id, :details

  def initialize(code, message, http_status, request_id, details = {})
    super(message)
    @code = code
    @http_status = http_status
    @request_id = request_id
    @details = details
  end
end

class MCCClient
  BASE_URL = ENV.fetch('MCC_API_BASE', 'https://api.mycrypto.co.in/api/v1')

  def initialize(api_key: nil, base_url: nil)
    @api_key = api_key || ENV.fetch('MCC_API_KEY') { raise 'MCC_API_KEY environment variable is not set' }
    @base_url = base_url || BASE_URL
  end

  def create_payment(amount:, currency: 'USD', crypto:, **options)
    body = { amount: amount, currency: currency, crypto: crypto }.merge(options)
    request(:post, '/payments/create', body)
  end

  def get_payment(payment_id)
    request(:get, "/payments/#{payment_id}")
  end

  def verify_payment(payment_id, tx_hash)
    request(:post, "/payments/#{payment_id}/verify", { txHash: tx_hash })
  end

  def list_payments(**filters)
    request(:get, '/payments', nil, filters)
  end

  def get_wallets
    request(:get, '/wallets')
  end

  def get_wallet(crypto)
    request(:get, "/wallets/#{crypto}")
  end

  def create_withdrawal(crypto:, amount:, address:, memo: nil)
    body = { amount: amount, address: address }
    body[:memo] = memo if memo
    request(:post, "/wallets/#{crypto}/withdraw", body)
  end

  def configure_auto_withdraw(crypto:, enabled:, address: nil, threshold: nil)
    body = { enabled: enabled }
    body[:address] = address if address
    body[:threshold] = threshold if threshold
    request(:put, "/wallets/#{crypto}/auto-withdraw", body)
  end

  private

  def request(method, path, body = nil, params = nil)
    uri = URI("#{@base_url}#{path}")
    uri.query = URI.encode_www_form(params) if params&.any?

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = 10
    http.read_timeout = 30

    req = case method
          when :get    then Net::HTTP::Get.new(uri)
          when :post   then Net::HTTP::Post.new(uri)
          when :put    then Net::HTTP::Put.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          end

    req['X-API-Key'] = @api_key
    req['Content-Type'] = 'application/json'

    if body
      req.body = body.to_json
    end

    response = http.request(req)
    data = JSON.parse(response.body)
    request_id = response['X-Request-Id']

    unless response.is_a?(Net::HTTPSuccess)
      error = data['error'] || {}
      raise MCCError.new(
        error['code'] || 'unknown',
        error['message'] || 'Unknown error',
        response.code.to_i,
        request_id,
        error['details'] || {}
      )
    end

    data
  end
end
```

### Create a Payment

```ruby
require_relative 'mcc_client'

mcc = MCCClient.new

begin
  payment = mcc.create_payment(
    amount: '99.99',
    currency: 'USD',
    crypto: 'USDT_ERC20',
    description: 'Order #ORD-12345',
    metadata: {
      order_id: 'ORD-12345',
      customer_email: 'buyer@example.com',
    },
    callbackUrl: 'https://yoursite.com/webhooks/mycryptocoin',
    redirectUrl: 'https://yoursite.com/orders/ORD-12345/complete',
    expiryMinutes: 30
  )

  puts "Payment created: #{payment['id']}"
  puts "Checkout URL: #{payment['checkout_url']}"
  puts "Deposit address: #{payment['deposit_address']}"
  puts "Amount: #{payment['crypto_amount']} #{payment['crypto']}"
  puts "Expires at: #{payment['expires_at']}"

rescue MCCError => e
  case e.code
  when 'invalid_request'
    puts "Invalid payment data: #{e.details}"
  else
    puts "Error [#{e.request_id}]: #{e.code} - #{e.message}"
  end
end
```

### Handle Webhooks (Sinatra)

```ruby
require 'sinatra'
require 'json'
require 'openssl'

WEBHOOK_SECRET = ENV.fetch('MCC_WEBHOOK_SECRET')

# Track processed deliveries (use Redis in production)
processed_deliveries = Set.new

post '/webhooks/mycryptocoin' do
  request.body.rewind
  raw_body = request.body.read
  signature = request.env['HTTP_X_MCC_SIGNATURE'] || ''
  timestamp = request.env['HTTP_X_MCC_TIMESTAMP'] || ''

  # Step 1: Verify required headers
  if signature.empty? || timestamp.empty?
    halt 401, { error: 'Missing signature headers' }.to_json
  end

  # Step 2: Prevent replay attacks (5-minute window)
  if (Time.now.to_i - timestamp.to_i).abs > 300
    halt 401, { error: 'Request timestamp too old' }.to_json
  end

  # Step 3: Verify HMAC-SHA256 signature
  payload = "#{timestamp}.#{raw_body}"
  expected = 'sha256=' + OpenSSL::HMAC.hexdigest('SHA256', WEBHOOK_SECRET, payload)

  unless Rack::Utils.secure_compare(signature, expected)
    halt 401, { error: 'Invalid signature' }.to_json
  end

  # Step 4: Deduplicate
  delivery_id = request.env['HTTP_X_MCC_DELIVERY_ID']
  if processed_deliveries.include?(delivery_id)
    return { received: true }.to_json
  end

  # Step 5: Process the event
  event = JSON.parse(raw_body)
  event_type = event['type']
  data = event['data']

  case event_type
  when 'payment.confirmed'
    order_id = data.dig('metadata', 'order_id')
    puts "Payment #{data['id']} confirmed for order #{order_id}"
    puts "Amount: #{data['crypto_amount']} #{data['crypto']}"
    # fulfill_order(order_id)

  when 'payment.failed'
    order_id = data.dig('metadata', 'order_id')
    puts "Payment #{data['id']} failed for order #{order_id}"

  when 'payment.expired'
    order_id = data.dig('metadata', 'order_id')
    puts "Payment #{data['id']} expired for order #{order_id}"

  when 'withdrawal.completed'
    puts "Withdrawal #{data['id']} completed: #{data['net_amount']} #{data['crypto']}"

  when 'withdrawal.failed'
    puts "Withdrawal #{data['id']} failed: #{data['amount']} #{data['crypto']}"
  end

  processed_deliveries.add(delivery_id)
  content_type :json
  { received: true }.to_json
end
```

### Process a Withdrawal

```ruby
require_relative 'mcc_client'

mcc = MCCClient.new

begin
  withdrawal = mcc.create_withdrawal(
    crypto: 'BTC',
    amount: '0.05000000',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  )

  puts "Withdrawal initiated: #{withdrawal['id']}"
  puts "Amount: #{withdrawal['amount']} BTC"
  puts "Network fee: #{withdrawal['network_fee']} BTC"
  puts "Net amount: #{withdrawal['net_amount']} BTC"
  puts "Status: #{withdrawal['status']}"

rescue MCCError => e
  case e.code
  when 'insufficient_balance'
    puts "Not enough funds: #{e.message}"
  when 'invalid_address'
    puts "Invalid address: #{e.message}"
  when 'below_minimum'
    puts "Below minimum: #{e.details}"
  else
    puts "Error [#{e.request_id}]: #{e.code} - #{e.message}"
  end
end
```

---

## cURL

### Authentication

**Register:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123!",
    "businessName": "My Business",
    "phone": "+919876543210"
  }'
```

**Verify WhatsApp OTP:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/verify-whatsapp-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "482916",
    "purpose": "registration"
  }'
```

**Login:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123!"
  }'
```

**Refresh Token:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Payments

**Create Payment:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/create \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": "USDT_ERC20",
    "amount": "99.99",
    "currency": "USD",
    "description": "Order #ORD-12345",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "callbackUrl": "https://yoursite.com/webhooks/crypto",
    "redirectUrl": "https://yoursite.com/success",
    "expiryMinutes": 30
  }'
```

**List Payments:**

```bash
curl "https://api.mycrypto.co.in/api/v1/payments?status=confirmed&crypto=USDT&page=1&limit=10" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Get Payment:**

```bash
curl https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Verify Payment:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/payments/pay_1a2b3c4d5e6f/verify \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Wallets

**List All Wallets:**

```bash
curl https://api.mycrypto.co.in/api/v1/wallets \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Get Specific Wallet:**

```bash
curl https://api.mycrypto.co.in/api/v1/wallets/BTC \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Configure Auto-Withdrawal:**

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/wallets/BTC/auto-withdraw \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "threshold": "0.01000000"
  }'
```

### Withdrawals

**Create BTC Withdrawal:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/wallets/BTC/withdraw \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "0.05000000",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  }'
```

**Create USDT (TRC-20) Withdrawal:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/wallets/USDT_TRC20/withdraw \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "500.000000",
    "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9"
  }'
```

### Transactions

**List Transactions:**

```bash
curl "https://api.mycrypto.co.in/api/v1/transactions?type=payment_received&crypto=USDT&date_from=2026-03-01&date_to=2026-03-19&page=1&limit=20" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Webhooks

**Register Webhook:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed", "withdrawal.completed"],
    "isActive": true
  }'
```

**List Webhooks:**

```bash
curl https://api.mycrypto.co.in/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Webhook:**

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["payment.created", "payment.confirming", "payment.confirmed", "payment.completed", "payment.expired", "payment.failed", "withdrawal.initiated", "withdrawal.completed", "withdrawal.failed"]
  }'
```

**Delete Webhook:**

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/webhooks/whk_m1n2o3p4q5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Merchant

**Get Profile:**

```bash
curl https://api.mycrypto.co.in/api/v1/merchant/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Update Profile:**

```bash
curl -X PUT https://api.mycrypto.co.in/api/v1/merchant/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Acme Digital Services Pvt Ltd",
    "website": "https://acmedigital.com"
  }'
```

**Generate API Key:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "mode": "live",
    "permissions": ["payments:read", "payments:write", "wallets:read", "webhooks:manage"]
  }'
```

> **Note:** Available permissions: `payments:read`, `payments:write`, `wallets:read`, `wallets:write`, `transactions:read`, `webhooks:manage`.

**List API Keys:**

```bash
curl https://api.mycrypto.co.in/api/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Revoke API Key:**

```bash
curl -X DELETE https://api.mycrypto.co.in/api/v1/merchant/api-keys/key_p1q2r3s4t5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Forgot / Reset Password

**Forgot Password:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com"
  }'
```

**Reset Password:**

```bash
curl -X POST https://api.mycrypto.co.in/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePass456!"
  }'
```
