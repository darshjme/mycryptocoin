'use client';

import React from 'react';

// All withdrawals are USDT TRC-20 to TRON addresses
const withdrawals = Array.from({ length: 10 }, (_, i) => ({
  id: `WDR-${3000 + i}`,
  crypto: 'USDT',
  network: 'TRC-20',
  amount: `$${(Math.random() * 5000 + 100).toFixed(2)}`,
  address: `T${['X8kR5', 'QnLF7', 'HjkP2', 'YbRt9', 'MxNw4'][i % 5]}...${Math.random().toString(36).slice(2, 6)}`,
  date: `Mar ${18 - (i % 10)}, 2026`,
  networkFee: '~1.00 USDT',
  status: ['completed', 'pending', 'completed', 'processing', 'failed'][i % 5],
  statusColor: ['success', 'warning', 'success', 'info', 'danger'][i % 5],
}));

export default function WithdrawalsPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-5 border-b border-[rgba(99,102,241,0.08)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h4 className="text-lg font-bold text-white">Withdrawal Requests</h4>
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all">
              Withdraw USDT TRC-20
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.06)]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">
                  <input type="checkbox" className="rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500/40" />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Withdrawal ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Destination</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => (
                <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500/40" />
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-slate-200">{w.id}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{w.date}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        US
                      </span>
                      <div>
                        <h5 className="text-sm font-medium text-slate-200">USDT <span className="text-xs text-slate-500">TRC-20</span></h5>
                        <span className="text-xs text-slate-500 font-mono">{w.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-200">{w.amount}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                      w.statusColor === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      w.statusColor === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      w.statusColor === 'danger' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(99,102,241,0.06)]">
          <p className="text-xs text-slate-500">Showing <span className="text-slate-300">1-10</span> from <span className="text-slate-300">50</span> data</p>
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
