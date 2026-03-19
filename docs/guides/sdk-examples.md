# SDK Examples

Copy-paste ready code examples for integrating MyCryptoCoin in JavaScript/Node.js, Python, PHP, and cURL.

---

## Table of Contents

- [JavaScript / Node.js](#javascript--nodejs)
- [Python](#python)
- [PHP](#php)
- [cURL](#curl)

---

## JavaScript / Node.js

### Setup

```javascript
// mcc-client.js
const API_BASE = process.env.MCC_API_BASE || 'https://api.mycrypto.co.in/v1';
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
    const payment = await mccRequest('POST', '/payments', {
      amount,
      currency,
      crypto,
      description: `Order #${orderId}`,
      metadata: {
        order_id: orderId,
        customer_email: customerEmail,
      },
      callback_url: 'https://yoursite.com/webhooks/mycryptocoin',
      redirect_url: `https://yoursite.com/orders/${orderId}/complete`,
      expiry_minutes: 30,
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

async function checkPayment(paymentId) {
  try {
    const result = await mccRequest('POST', `/payments/${paymentId}/verify`);

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
  const timestamp = req.headers['x-mcc-timestamp'];
  const body = req.body.toString();

  if (!signature || !timestamp || !body) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  const payload = timestamp + '.' + body;
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
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
    console.log(`Webhook received: ${event.type} (${event.id})`);

    // Step 3: Handle event types
    try {
      switch (event.type) {
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

        case 'payment.settled': {
          const { id, net_amount, crypto } = event.data;
          console.log(`Payment ${id} settled: ${net_amount} ${crypto} credited`);
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
    const withdrawal = await mccRequest('POST', '/withdrawals', {
      crypto: 'BTC',
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

API_BASE = os.environ.get('MCC_API_BASE', 'https://api.mycrypto.co.in/v1')
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
        return self._request('POST', '/payments', json=body)

    def get_payment(self, payment_id):
        return self._request('GET', f'/payments/{payment_id}')

    def verify_payment(self, payment_id):
        return self._request('POST', f'/payments/{payment_id}/verify')

    def list_payments(self, **filters):
        return self._request('GET', '/payments', params=filters)

    def get_wallets(self):
        return self._request('GET', '/wallets')

    def get_wallet(self, crypto):
        return self._request('GET', f'/wallets/{crypto}')

    def create_withdrawal(self, crypto, amount, address, **kwargs):
        body = {'crypto': crypto, 'amount': amount, 'address': address}
        body.update(kwargs)
        return self._request('POST', '/withdrawals', json=body)

    def list_withdrawals(self, **filters):
        return self._request('GET', '/withdrawals', params=filters)

    def get_withdrawal(self, withdrawal_id):
        return self._request('GET', f'/withdrawals/{withdrawal_id}')
```

### Create a Payment

```python
from mcc_client import MCCClient, MCCError

mcc = MCCClient()

try:
    payment = mcc.create_payment(
        amount=99.99,
        currency='USD',
        crypto='USDT',
        description='Order #ORD-12345',
        metadata={
            'order_id': 'ORD-12345',
            'customer_email': 'buyer@example.com',
        },
        callback_url='https://yoursite.com/webhooks/mycryptocoin',
        redirect_url='https://yoursite.com/orders/ORD-12345/complete',
        expiry_minutes=30,
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
    result = mcc.verify_payment('pay_1a2b3c4d5e6f')

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
    timestamp = req.headers.get('X-MCC-Timestamp', '')
    body = req.get_data(as_text=True)

    if not signature or not timestamp or not body:
        return False

    # Reject requests older than 5 minutes
    current_time = int(time.time())
    if abs(current_time - int(timestamp)) > 300:
        return False

    payload = f"{timestamp}.{body}"
    expected = 'sha256=' + hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)


@app.route('/webhooks/mycryptocoin', methods=['POST'])
def handle_webhook():
    # Step 1: Verify signature
    if not verify_signature(request):
        return jsonify({'error': 'Invalid signature'}), 401

    # Step 2: Deduplicate
    delivery_id = request.headers.get('X-MCC-Delivery-Id')
    if delivery_id in processed_deliveries:
        return jsonify({'received': True}), 200

    # Step 3: Process event
    event = json.loads(request.get_data(as_text=True))
    event_type = event['type']
    data = event['data']

    print(f"Webhook received: {event_type} ({event['id']})")

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

    processed_deliveries.add(delivery_id)
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
        crypto='BTC',
        amount='0.05000000',
        address='bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
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
        $this->baseUrl = $baseUrl ?: (getenv('MCC_API_BASE') ?: 'https://api.mycrypto.co.in/v1');

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
        return $this->request('POST', '/payments', $body);
    }

    public function getPayment($paymentId) {
        return $this->request('GET', "/payments/$paymentId");
    }

    public function verifyPayment($paymentId) {
        return $this->request('POST', "/payments/$paymentId/verify");
    }

    public function listPayments($filters = []) {
        return $this->request('GET', '/payments', null, $filters);
    }

    public function getWallets() {
        return $this->request('GET', '/wallets');
    }

    public function createWithdrawal($crypto, $amount, $address, $options = []) {
        $body = array_merge([
            'crypto' => $crypto,
            'amount' => $amount,
            'address' => $address,
        ], $options);
        return $this->request('POST', '/withdrawals', $body);
    }

    public function listWithdrawals($filters = []) {
        return $this->request('GET', '/withdrawals', null, $filters);
    }
}
```

### Create a Payment

```php
<?php
require_once 'MccClient.php';

$mcc = new MccClient();

try {
    $payment = $mcc->createPayment(99.99, 'USD', 'USDT', [
        'description' => 'Order #ORD-12345',
        'metadata' => [
            'order_id' => 'ORD-12345',
            'customer_email' => 'buyer@example.com',
        ],
        'callback_url' => 'https://yoursite.com/webhooks/mycryptocoin',
        'redirect_url' => 'https://yoursite.com/orders/ORD-12345/complete',
        'expiry_minutes' => 30,
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
$timestamp = $normalizedHeaders['x-mcc-timestamp'] ?? '';
$deliveryId = $normalizedHeaders['x-mcc-delivery-id'] ?? '';

// Step 1: Verify signature
if (empty($signature) || empty($timestamp) || empty($body)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing signature headers']);
    exit;
}

// Reject old requests
if (abs(time() - intval($timestamp)) > 300) {
    http_response_code(401);
    echo json_encode(['error' => 'Request too old']);
    exit;
}

$payload = $timestamp . '.' . $body;
$expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $webhookSecret);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Step 2: Parse event
$event = json_decode($body, true);
$eventType = $event['type'];
$data = $event['data'];

error_log("Webhook received: $eventType ({$event['id']})");

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

## cURL

### Authentication

**Register:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "email": "you@example.com",
    "password": "SecurePass123",
    "business_name": "My Business",
    "business_type": "private_limited"
  }'
```

**Verify OTP:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "otp": "482916"
  }'
```

**Login:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "password": "SecurePass123"
  }'
```

**Refresh Token:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "mcc_rt_x7k9m2p4q8..."
  }'
```

### Payments

**Create Payment:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/payments \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "currency": "USD",
    "crypto": "USDT",
    "description": "Order #ORD-12345",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_email": "buyer@example.com"
    },
    "callback_url": "https://yoursite.com/webhooks/crypto",
    "redirect_url": "https://yoursite.com/success",
    "expiry_minutes": 30
  }'
```

**List Payments:**

```bash
curl "https://api.mycrypto.co.in/v1/payments?status=confirmed&crypto=USDT&page=1&limit=10" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Get Payment:**

```bash
curl https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Verify Payment:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/payments/pay_1a2b3c4d5e6f/verify \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Wallets

**List All Wallets:**

```bash
curl https://api.mycrypto.co.in/v1/wallets \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Get Specific Wallet:**

```bash
curl https://api.mycrypto.co.in/v1/wallets/BTC \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Configure Auto-Withdrawal:**

```bash
curl -X PUT https://api.mycrypto.co.in/v1/wallets/BTC/auto-withdraw \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "threshold": "0.01000000"
  }'
```

### Withdrawals

**Create Withdrawal:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/withdrawals \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": "BTC",
    "amount": "0.05000000",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  }'
```

**Create USDT Withdrawal (specify network):**

```bash
curl -X POST https://api.mycrypto.co.in/v1/withdrawals \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "crypto": "USDT",
    "amount": "500.000000",
    "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9",
    "network": "tron"
  }'
```

**List Withdrawals:**

```bash
curl "https://api.mycrypto.co.in/v1/withdrawals?status=completed&limit=5" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Get Withdrawal:**

```bash
curl https://api.mycrypto.co.in/v1/withdrawals/wth_9z8y7x6w5v \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Transactions

**List Transactions:**

```bash
curl "https://api.mycrypto.co.in/v1/transactions?type=payment_received&crypto=USDT&date_from=2026-03-01&date_to=2026-03-19&page=1&limit=20" \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Webhooks

**Register Webhook:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com/webhooks/mycryptocoin",
    "events": ["payment.confirmed", "payment.failed", "withdrawal.completed"],
    "description": "Production webhook"
  }'
```

**List Webhooks:**

```bash
curl https://api.mycrypto.co.in/v1/webhooks \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Update Webhook:**

```bash
curl -X PUT https://api.mycrypto.co.in/v1/webhooks/whk_m1n2o3p4q5 \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["*"],
    "description": "All events"
  }'
```

**Delete Webhook:**

```bash
curl -X DELETE https://api.mycrypto.co.in/v1/webhooks/whk_m1n2o3p4q5 \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Test Webhook:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/webhooks/whk_m1n2o3p4q5/test \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

### Merchant

**Get Profile:**

```bash
curl https://api.mycrypto.co.in/v1/merchant/profile \
  -H "X-API-Key: mcc_live_YOUR_KEY"
```

**Update Profile:**

```bash
curl -X PUT https://api.mycrypto.co.in/v1/merchant/profile \
  -H "X-API-Key: mcc_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Acme Digital Services Pvt Ltd",
    "website": "https://acmedigital.com",
    "supported_cryptos": ["BTC", "ETH", "USDT", "USDC", "SOL"]
  }'
```

**Generate API Key:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "mode": "live",
    "permissions": ["payments:read", "payments:write", "wallets:read"]
  }'
```

**List API Keys:**

```bash
curl https://api.mycrypto.co.in/v1/merchant/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Revoke API Key:**

```bash
curl -X DELETE https://api.mycrypto.co.in/v1/merchant/api-keys/key_p1q2r3s4t5 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Forgot / Reset Password

**Forgot Password:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210"
  }'
```

**Reset Password:**

```bash
curl -X POST https://api.mycrypto.co.in/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "+919876543210",
    "otp": "482916",
    "new_password": "NewSecurePass456"
  }'
```
