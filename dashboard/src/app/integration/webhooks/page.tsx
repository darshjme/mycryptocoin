'use client';

import React from 'react';

const webhooks = [
  { url: 'https://yourstore.com/api/webhook', events: ['payment.confirmed', 'payment.failed'], status: 'active', lastTriggered: '2 min ago' },
  { url: 'https://backup.yourstore.com/hook', events: ['withdrawal.completed'], status: 'active', lastTriggered: '1 hour ago' },
];

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Webhook Management</h2>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all">
          Add Webhook
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="divide-y divide-[rgba(99,102,241,0.05)]">
          {webhooks.map((wh, i) => (
            <div key={i} className="p-5 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-200 font-mono">{wh.url}</h5>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {wh.events.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Last triggered: {wh.lastTriggered}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400">{wh.status}</span>
                  <button className="px-3 py-1 rounded-lg border border-[rgba(99,102,241,0.2)] text-slate-400 text-xs hover:bg-white/5 transition-colors">Test</button>
                  <button className="px-3 py-1 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/5 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
