'use client';

import React from 'react';
import Link from 'next/link';

export default function SDKPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">SDK & Code Examples</h2>
      <p className="text-sm text-slate-400">
        Visit the main <Link href="/integration" className="text-indigo-400 hover:text-indigo-300 underline">Integration page</Link> for complete SDK examples in PHP, Python, JavaScript, Ruby, and cURL.
      </p>
      <div className="glass-card">
        <h3 className="text-base font-bold text-white mb-4">Quick Start</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0a0d16] border border-[rgba(99,102,241,0.08)]">
            <h4 className="text-sm font-semibold text-indigo-400 mb-2">1. Get your API key</h4>
            <p className="text-xs text-slate-400">Generate an API key from the <Link href="/integration" className="text-indigo-400">API Keys</Link> section.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0d16] border border-[rgba(99,102,241,0.08)]">
            <h4 className="text-sm font-semibold text-indigo-400 mb-2">2. Create a payment</h4>
            <pre className="text-xs text-slate-300 font-mono mt-2">POST /v1/payments</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0d16] border border-[rgba(99,102,241,0.08)]">
            <h4 className="text-sm font-semibold text-indigo-400 mb-2">3. Redirect customer</h4>
            <p className="text-xs text-slate-400">Use the returned <code className="text-indigo-300">payment_url</code> to redirect the customer to pay.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0d16] border border-[rgba(99,102,241,0.08)]">
            <h4 className="text-sm font-semibold text-indigo-400 mb-2">4. Handle webhook</h4>
            <p className="text-xs text-slate-400">Listen for <code className="text-indigo-300">payment.confirmed</code> webhook events on your server.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0a0d16] border border-[rgba(99,102,241,0.08)]">
            <h4 className="text-sm font-semibold text-indigo-400 mb-2">5. Verify signature</h4>
            <p className="text-xs text-slate-400">Always verify the <code className="text-indigo-300">X-MyCryptoCoin-Signature</code> header using HMAC-SHA256.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
