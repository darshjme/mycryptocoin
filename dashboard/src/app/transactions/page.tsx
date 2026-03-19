'use client';

import React, { useState } from 'react';

const allTransactions = Array.from({ length: 15 }, (_, i) => ({
  id: `TXN-${2000 + i}`,
  type: ['payment', 'withdrawal', 'auto-convert', 'fee'][i % 4],
  crypto: ['BTC', 'ETH', 'USDT', 'LTC', 'SOL'][i % 5],
  amount: `${(Math.random() * 5000 + 50).toFixed(2)}`,
  cryptoAmount: `${(Math.random() * 2).toFixed(6)}`,
  status: ['completed', 'pending', 'completed', 'failed'][i % 4],
  date: `Mar ${18 - (i % 10)}, 2026`,
  customer: `customer_${1000 + i}@email.com`,
}));

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'withdrawals'>('all');

  const filtered = activeTab === 'all'
    ? allTransactions
    : activeTab === 'payments'
    ? allTransactions.filter((t) => t.type === 'payment')
    : allTransactions.filter((t) => t.type === 'withdrawal');

  return (
    <div className="space-y-6">
      {/* Card with tabs - matching History card */}
      <div className="glass-card p-0 overflow-hidden">
        {/* Header with tabs - matching History card-header */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-5 border-b border-[rgba(99,102,241,0.08)]">
          <h4 className="text-lg font-bold text-white">Transaction History</h4>
          <nav className="flex gap-1 bg-[#1a1d2e]/50 rounded-xl p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'payments', label: 'Payments' },
              { key: 'withdrawals', label: 'Withdrawals' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.06)]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Transaction ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Crypto</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount (USD)</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Crypto Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-indigo-400 font-mono">{tx.id}</td>
                  <td className="px-5 py-3 text-sm text-slate-300 capitalize">{tx.type}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md ${
                      tx.crypto === 'BTC' ? 'bg-amber-500/10 text-amber-400' :
                      tx.crypto === 'ETH' ? 'bg-indigo-500/10 text-indigo-400' :
                      tx.crypto === 'USDT' ? 'bg-emerald-500/10 text-emerald-400' :
                      tx.crypto === 'LTC' ? 'bg-slate-500/10 text-slate-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {tx.crypto}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-200">${tx.amount}</td>
                  <td className="px-5 py-3 text-sm text-slate-400 font-mono">{tx.cryptoAmount}</td>
                  <td className="px-5 py-3 text-sm text-slate-400">{tx.date}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(99,102,241,0.06)]">
          <p className="text-xs text-slate-500">
            Showing <span className="text-slate-300">1-{filtered.length}</span> from <span className="text-slate-300">250</span> data
          </p>
          <nav className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5">1</button>
            <button className="w-8 h-8 rounded-lg text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2</button>
            <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5">3</button>
            <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
