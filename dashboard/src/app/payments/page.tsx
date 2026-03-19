'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PaymentVolumeChart = dynamic(
  () => import('@/components/charts/PaymentVolumeChart'),
  { ssr: false, loading: () => <div className="h-[350px] shimmer rounded-xl" /> }
);

const cryptoPreviews = [
  { name: 'BTC', bg: 'bg-amber-500/20', text: 'text-amber-400', count: '342', change: '+12%', up: true },
  { name: 'ETH', bg: 'bg-indigo-500/20', text: 'text-indigo-400', count: '256', change: '+8%', up: true },
  { name: 'USDT', bg: 'bg-emerald-500/20', text: 'text-emerald-400', count: '189', change: '+22%', up: true },
  { name: 'LTC', bg: 'bg-slate-500/20', text: 'text-slate-400', count: '87', change: '-3%', up: false },
  { name: 'SOL', bg: 'bg-purple-500/20', text: 'text-purple-400', count: '64', change: '+45%', up: true },
];

const recentPayments = [
  { id: 'PAY-1001', crypto: 'BTC', amount: '0.0125', usd: '$526.50', status: 'confirmed', time: '2 min ago' },
  { id: 'PAY-1002', crypto: 'ETH', amount: '0.452', usd: '$1,032.00', status: 'pending', time: '5 min ago' },
  { id: 'PAY-1003', crypto: 'USDT', amount: '250.00', usd: '$250.00', status: 'confirmed', time: '12 min ago' },
  { id: 'PAY-1004', crypto: 'LTC', amount: '3.5', usd: '$239.75', status: 'confirmed', time: '15 min ago' },
  { id: 'PAY-1005', crypto: 'BTC', amount: '0.035', usd: '$1,474.50', status: 'processing', time: '20 min ago' },
  { id: 'PAY-1006', crypto: 'ETH', amount: '1.2', usd: '$2,742.00', status: 'confirmed', time: '25 min ago' },
  { id: 'PAY-1007', crypto: 'USDT', amount: '500.00', usd: '$500.00', status: 'pending', time: '30 min ago' },
];

export default function PaymentsPage() {
  const [timeFilter, setTimeFilter] = useState('This Month');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Left - 3/4 */}
      <div className="xl:col-span-3 space-y-6">
        {/* Chart Card - matching MarketWatch chart card */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-lg font-bold text-white">Payment Volume</h2>
            <div className="flex items-end justify-between flex-wrap gap-4 mt-2">
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-xs text-slate-500">This Month</span>
                  <h4 className="text-lg font-bold text-slate-100">$29,999.00</h4>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Transactions</span>
                  <h4 className="text-lg font-bold text-slate-100 flex items-center">480 <span className="ms-2 text-xs text-slate-400">- 0.5%</span></h4>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Conversion Rate</span>
                  <h4 className="text-lg font-bold text-slate-100">94.2%</h4>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Volume</span>
                  <h4 className="text-lg font-bold text-slate-100">175k</h4>
                </div>
              </div>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/30"
              >
                <option>This Month</option>
                <option>This Week</option>
                <option>Today</option>
              </select>
            </div>
          </div>
          <div className="p-4 pt-0">
            <PaymentVolumeChart />
          </div>
        </div>

        {/* Recent Payments Table - matching MarketCardSlider area */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[rgba(99,102,241,0.08)]">
            <h2 className="text-base font-bold text-white">Incoming Payments</h2>
            <Link href="/transactions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.06)]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Payment ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Crypto</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">USD Value</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment, i) => (
                  <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-slate-200">{payment.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          payment.crypto === 'BTC' ? 'bg-amber-500/20 text-amber-400' :
                          payment.crypto === 'ETH' ? 'bg-indigo-500/20 text-indigo-400' :
                          payment.crypto === 'USDT' ? 'bg-emerald-500/20 text-emerald-400' :
                          payment.crypto === 'LTC' ? 'bg-slate-500/20 text-slate-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {payment.crypto.slice(0, 2)}
                        </span>
                        <span className="text-sm text-slate-300">{payment.crypto}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300 font-mono">{payment.amount}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-200">{payment.usd}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{payment.time}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                        payment.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        payment.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          payment.status === 'confirmed' ? 'bg-emerald-400' :
                          payment.status === 'pending' ? 'bg-amber-400' : 'bg-blue-400 animate-pulse'
                        }`} />
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination - matching CryptoZone table-pagenation */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(99,102,241,0.06)]">
            <p className="text-xs text-slate-500">
              Showing <span className="text-slate-300">1-7</span> from <span className="text-slate-300">100</span> data
            </p>
            <nav className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5 transition-colors flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5">1</button>
              <button className="w-8 h-8 rounded-lg text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">2</button>
              <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5">3</button>
              <button className="w-8 h-8 rounded-lg text-xs text-slate-400 hover:bg-white/5 transition-colors flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Right - 1/4 */}
      <div className="space-y-6">
        {/* Crypto Breakdown - matching Market Previews card */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-5 pb-0">
            <h2 className="text-base font-bold text-white">Payment by Crypto</h2>
          </div>
          <div className="pt-2">
            {cryptoPreviews.map((crypto, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${crypto.bg} ${crypto.text}`}>
                    {crypto.name.slice(0, 2)}
                  </span>
                  <div>
                    <h6 className="text-sm font-semibold text-slate-200">{crypto.name}</h6>
                    <span className="text-xs text-slate-500">Payments</span>
                  </div>
                </div>
                <div className="text-right">
                  <h6 className="text-sm font-semibold text-slate-200">{crypto.count}</h6>
                  <span className={`text-xs ${crypto.up ? 'text-emerald-400' : 'text-red-400'}`}>{crypto.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Order equivalent - payment queue */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-0 overflow-hidden">
          <div className="p-5 pb-0">
            <h2 className="text-sm font-bold text-white">Pending Queue</h2>
          </div>
          <div className="p-4 pt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/60">
                  <th className="py-2 text-left text-xs">ID</th>
                  <th className="py-2 text-center text-xs">Amount</th>
                  <th className="py-2 text-right text-xs">Crypto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: '#1042', amount: '$526', crypto: 'BTC' },
                  { id: '#1043', amount: '$1,032', crypto: 'ETH' },
                  { id: '#1044', amount: '$250', crypto: 'USDT' },
                  { id: '#1045', amount: '$75', crypto: 'LTC' },
                  { id: '#1046', amount: '$890', crypto: 'BTC' },
                  { id: '#1047', amount: '$340', crypto: 'ETH' },
                  { id: '#1048', amount: '$120', crypto: 'SOL' },
                ].map((item, i) => (
                  <tr key={i} className="text-white/80 border-t border-white/5">
                    <td className="py-2 text-xs">{item.id}</td>
                    <td className="py-2 text-center text-xs">{item.amount}</td>
                    <td className="py-2 text-right text-xs">{item.crypto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
