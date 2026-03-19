'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const CryptoAllocationChart = dynamic(
  () => import('@/components/charts/CryptoAllocationChart'),
  { ssr: false, loading: () => <div className="h-[300px] shimmer rounded-xl" /> }
);

// Single USDT TRC-20 settlement wallet — all crypto payments are auto-converted to USDT
const usdtWallet = {
  crypto: 'USDT',
  network: 'TRC-20',
  name: 'USDT TRC-20 Settlement',
  balance: '350,136.94',
  address: 'TX8kR5...9f1d',
  color: 'from-emerald-500 to-teal-600',
};

// Deposit addresses for customers to pay in any supported crypto
const depositAddresses = [
  { crypto: 'BTC', name: 'Bitcoin', address: 'bc1q...a7f3', color: 'from-amber-500 to-orange-600' },
  { crypto: 'ETH', name: 'Ethereum', address: '0x7a...3e2b', color: 'from-indigo-500 to-purple-600' },
  { crypto: 'USDT', name: 'Tether (TRC-20)', address: 'TX8k...9f1d', color: 'from-emerald-500 to-teal-600' },
  { crypto: 'BNB', name: 'BNB', address: '0xBb...bD68', color: 'from-yellow-500 to-amber-600' },
  { crypto: 'SOL', name: 'Solana', address: '7Kf4...2xQe', color: 'from-purple-500 to-pink-600' },
];

// Conversion history — shows original crypto received and USDT equivalent credited
const transactions = [
  { from: 'Received 0.0125 BTC', amount: '+ 526.50 USDT', usd: '$526.50', date: 'Mar 18, 2026', type: 'in', detail: 'Rate: 1 BTC = $42,120' },
  { from: 'Withdrawal (TRC-20)', amount: '- 1,032.00 USDT', usd: '$1,032.00', date: 'Mar 17, 2026', type: 'out', detail: 'To: TX8k...9f1d' },
  { from: 'Received 0.452 ETH', amount: '+ 1,032.00 USDT', usd: '$1,032.00', date: 'Mar 17, 2026', type: 'in', detail: 'Rate: 1 ETH = $2,283.19' },
  { from: 'Received 250.00 USDT', amount: '+ 250.00 USDT', usd: '$250.00', date: 'Mar 17, 2026', type: 'in', detail: 'Rate: 1 USDT = $1.00' },
  { from: 'Received 3.5 SOL', amount: '+ 343.00 USDT', usd: '$343.00', date: 'Mar 16, 2026', type: 'in', detail: 'Rate: 1 SOL = $98.00' },
];

export default function WalletsPage() {
  const [dropSelect, setDropSelect] = useState('This Month');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left 2/3 */}
      <div className="xl:col-span-2 space-y-6">
        {/* Wallet Cards row - matching Banking prim-card + exchange card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* USDT TRC-20 Settlement Wallet Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 relative overflow-hidden">
            <svg className="absolute top-4 left-5 w-12 h-12 text-white/20" fill="currentColor" viewBox="0 0 64 64">
              <path d="M45.3 9.3H18.7c-2.5 0-4.9 1-6.6 2.7-1.8 1.8-2.7 4.1-2.7 6.6v26.7c0 2.5 1 4.9 2.7 6.6 1.8 1.8 4.1 2.7 6.6 2.7h26.7c2.5 0 4.9-1 6.6-2.7 1.8-1.8 2.7-4.1 2.7-6.6V18.7c0-2.5-1-4.9-2.7-6.6-1.8-1.8-4.1-2.7-6.6-2.7z" />
            </svg>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-white/80 text-sm font-medium">USDT TRC-20 Settlement Wallet</h4>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[10px] font-semibold">TRON</span>
              </div>
              <h4 className="text-white text-lg font-mono tracking-wider">{usdtWallet.address}</h4>
              <div className="flex items-center justify-between mt-6">
                <div>
                  <span className="text-white/50 text-xs">Available Balance</span>
                  <h4 className="text-white text-xl font-bold">${usdtWallet.balance} USDT</h4>
                </div>
                <span className="text-white/60 text-xs">All crypto auto-converted</span>
              </div>
            </div>
          </div>

          {/* Your Balance card */}
          <div className="glass-card">
            <h2 className="text-base font-bold text-white">Settlement Balance</h2>
            <div className="mt-4">
              <h6 className="text-sm text-slate-400">USDT TRC-20 (all payments auto-converted)</h6>
              <div className="flex items-baseline justify-between mt-2">
                <h4 className="text-2xl font-bold text-white">${usdtWallet.balance} USDT</h4>
                <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +15.2%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Deposit Addresses — accept any crypto */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.08)]">
            <h2 className="text-base font-bold text-white">Customer Deposit Addresses</h2>
            <span className="text-xs text-slate-500">Customers pay here — auto-converted to USDT</span>
          </div>
          <div className="divide-y divide-[rgba(99,102,241,0.05)]">
            {depositAddresses.map((addr, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${addr.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {addr.crypto.slice(0, 2)}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">{addr.name}</h5>
                    <span className="text-xs text-slate-500 font-mono">{addr.address}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400/80 mr-2">Auto-converts to USDT</span>
                  <button className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-colors">
                    Copy Address
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Withdraw — USDT TRC-20 only */}
        <div className="glass-card p-5">
          <h2 className="text-base font-bold text-white mb-4">Withdraw USDT TRC-20</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (USDT)</label>
              <input type="text" placeholder="0.00" className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">TRON Address (starts with T)</label>
              <input type="text" placeholder="T..." className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/30" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">Est. network fee: ~1 USDT (TRON)</span>
            <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all">
              Withdraw USDT
            </button>
          </div>
        </div>

        {/* Latest Transactions - matching Banking Latest Transaction */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.08)]">
            <h2 className="text-base font-bold text-white">Conversion History</h2>
            <select
              value={dropSelect}
              onChange={(e) => setDropSelect(e.target.value)}
              className="bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option>This Month</option>
              <option>This Week</option>
              <option>Today</option>
            </select>
          </div>
          <div className="divide-y divide-[rgba(99,102,241,0.04)]">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <svg className={`w-5 h-5 ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">{tx.from}</h5>
                    <span className="text-xs text-slate-500">{tx.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h5 className={`text-sm font-semibold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount}</h5>
                  <span className="text-xs text-slate-500">{tx.usd}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(99,102,241,0.06)]">
            <p className="text-xs text-slate-500">Showing <span className="text-slate-300">1-5</span> from <span className="text-slate-300">100</span> data</p>
            <nav className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg text-xs text-slate-400 hover:bg-white/5 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-7 h-7 rounded-lg text-xs text-slate-400 hover:bg-white/5">1</button>
              <button className="w-7 h-7 rounded-lg text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2</button>
              <button className="w-7 h-7 rounded-lg text-xs text-slate-400 hover:bg-white/5">3</button>
              <button className="w-7 h-7 rounded-lg text-xs text-slate-400 hover:bg-white/5 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Right 1/3 */}
      <div className="space-y-6">
        {/* Income / Outcome cards - matching Banking */}
        {['USDT Received', 'USDT Withdrawn'].map((title, i) => (
          <div key={i} className="glass-card text-center">
            <h2 className="text-sm font-bold text-white">{title}</h2>
            <div className="mt-3 w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 32 32">
                <path d="M9 30h14a5 5 0 005-5v-6a5 5 0 00-5-5H9a5 5 0 00-5 5v6a5 5 0 005 5zM16 26a4 4 0 110-8 4 4 0 010 8zM16 2a1 1 0 00-1 1v5.59l-2.54-2.54a1 1 0 10-1.41 1.41l4.24 4.24a1 1 0 001.42 0l4.24-4.24a1 1 0 10-1.41-1.41L17 8.59V3a1 1 0 00-1-1z" />
              </svg>
            </div>
            <div className="mt-3 text-xs text-slate-500">Last Month (USDT)</div>
            <div className="text-xl font-bold text-white mt-1">{i === 0 ? '$23,741.60' : '$18,320.00'}</div>
          </div>
        ))}

        {/* Allocation Chart */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-5 pb-0">
            <h2 className="text-sm font-bold text-white">Crypto Allocation</h2>
          </div>
          <div className="p-5">
            <CryptoAllocationChart />
          </div>
        </div>

        {/* Monthly Target - matching Banking bg-primary card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Monthly Target</h3>
              <h6 className="text-white/70 text-sm mt-3">Total Collected</h6>
              <div className="text-2xl font-bold text-white mt-1">$25,365.25</div>
              <p className="text-white/60 text-xs mt-2">25% more than last month</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
              <span className="text-xl font-bold text-white">75%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
