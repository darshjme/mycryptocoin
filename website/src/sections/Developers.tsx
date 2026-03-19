'use client';

import { useState, useEffect, useRef } from 'react';

const tabs = [
  {
    label: 'cURL',
    lang: 'bash',
    code: `curl -X POST https://api.mycrypto.co.in/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "crypto": "BTC",
    "callback_url": "https://yoursite.com/webhook",
    "success_url": "https://yoursite.com/success",
    "metadata": {
      "order_id": "ORD-12345"
    }
  }'`,
  },
  {
    label: 'JavaScript',
    lang: 'javascript',
    code: `import MyCryptoCoin from '@mycryptocoin/sdk';

const mcc = new MyCryptoCoin('YOUR_API_KEY');

const payment = await mcc.payments.create({
  amount: 100.00,
  currency: 'USD',
  crypto: 'BTC',
  callback_url: 'https://yoursite.com/webhook',
  success_url: 'https://yoursite.com/success',
  metadata: {
    order_id: 'ORD-12345'
  }
});

console.log(payment.checkout_url);
// => https://pay.mycrypto.co.in/p/abc123`,
  },
  {
    label: 'Python',
    lang: 'python',
    code: `import mycryptocoin

client = mycryptocoin.Client(api_key="YOUR_API_KEY")

payment = client.payments.create(
    amount=100.00,
    currency="USD",
    crypto="BTC",
    callback_url="https://yoursite.com/webhook",
    success_url="https://yoursite.com/success",
    metadata={
        "order_id": "ORD-12345"
    }
)

print(payment.checkout_url)
# => https://pay.mycrypto.co.in/p/abc123`,
  },
  {
    label: 'PHP',
    lang: 'php',
    code: `<?php
use MyCryptoCoin\\Client;

$client = new Client('YOUR_API_KEY');

$payment = $client->payments->create([
    'amount' => 100.00,
    'currency' => 'USD',
    'crypto' => 'BTC',
    'callback_url' => 'https://yoursite.com/webhook',
    'success_url' => 'https://yoursite.com/success',
    'metadata' => [
        'order_id' => 'ORD-12345'
    ]
]);

echo $payment->checkout_url;
// => https://pay.mycrypto.co.in/p/abc123`,
  },
];

function highlightSyntax(code: string, lang: string): string {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  html = html.replace(/(\/\/.*$|#.*$)/gm, '<span class="token-comment">$1</span>');

  // Strings
  html = html.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span class="token-string">$&</span>');

  // Keywords
  const keywords = lang === 'python'
    ? /\b(import|from|def|class|return|if|else|for|while|in|is|not|and|or|True|False|None|print|await|async)\b/g
    : lang === 'php'
    ? /\b(use|new|echo|class|function|return|if|else|public|private|protected|namespace)\b/g
    : /\b(const|let|var|import|from|export|default|function|return|if|else|for|while|new|class|async|await|console)\b/g;
  html = html.replace(keywords, '<span class="token-keyword">$1</span>');

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');

  return html;
}

export default function Developers() {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="developers" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Text */}
          <div data-aos="fade-right">
            <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">For Developers</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Integrate in <span className="text-gradient">Minutes</span>, Not Weeks.
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our RESTful API is designed with developer experience in mind. Clean endpoints, comprehensive documentation, and SDKs in every major language. If you have used Stripe, you will feel right at home.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'RESTful API with JSON responses',
                'Webhook events for real-time updates',
                'Test mode with sandbox environment',
                'SDKs: JavaScript, Python, PHP, Ruby',
                'WordPress / WooCommerce plugin',
                'Comprehensive API documentation',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <a
              href="https://docs.mycrypto.co.in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
            >
              Read the Docs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Right - Code Block */}
          <div data-aos="fade-left">
            <div className="code-block">
              {/* Tab bar */}
              <div className="code-header !justify-start">
                <div className="flex gap-1.5 mr-4">
                  <div className="code-dot bg-red-500/70" />
                  <div className="code-dot bg-yellow-500/70" />
                  <div className="code-dot bg-green-500/70" />
                </div>
                <div className="flex gap-1">
                  {tabs.map((tab, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        activeTab === i
                          ? 'bg-white/10 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="text-[13px] leading-relaxed !p-5 overflow-x-auto">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightSyntax(tabs[activeTab].code, tabs[activeTab].lang),
                  }}
                />
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
