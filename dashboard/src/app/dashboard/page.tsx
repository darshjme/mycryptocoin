'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BalanceCardSlider from '@/components/dashboard/BalanceCardSlider';
import QuickWithdrawForm from '@/components/dashboard/QuickWithdrawForm';

const PaymentVolumeChart = dynamic(
  () => import('@/components/charts/PaymentVolumeChart'),
  { ssr: false, loading: () => <div className="h-[350px] shimmer rounded-xl" /> }
);
const CryptoAllocationChart = dynamic(
  () => import('@/components/charts/CryptoAllocationChart'),
  { ssr: false, loading: () => <div className="h-[400px] shimmer rounded-xl" /> }
);
const ServerStatusBar = dynamic(
  () => import('@/components/charts/ServerStatusBar'),
  { ssr: false, loading: () => <div className="h-[200px] shimmer rounded-xl" /> }
);

const cryptoPreviews = [
  { name: 'BTC', bg: 'bg-amber-500/20', text: 'text-amber-400', price: '$42,850.00', change: '+2.4%', up: true },
  { name: 'ETH', bg: 'bg-indigo-500/20', text: 'text-indigo-400', price: '$2,285.00', change: '+1.8%', up: true },
  { name: 'USDT', bg: 'bg-emerald-500/20', text: 'text-emerald-400', price: '$1.00', change: '0.0%', up: true },
  { name: 'LTC', bg: 'bg-slate-500/20', text: 'text-slate-400', price: '$68.50', change: '-0.5%', up: false },
  { name: 'SOL', bg: 'bg-purple-500/20', text: 'text-purple-400', price: '$98.20', change: '+5.2%', up: true },
];

const recentPayments = Array.from({ length: 11 }, (_, i) => ({
  id: `PAY-${1000 + i}`,
  amount: (Math.random() * 5000 + 100).toFixed(2),
  crypto: ['BTC', 'ETH', 'USDT', 'LTC'][i % 4],
  status: ['confirmed', 'pending', 'confirmed', 'processing'][i % 4] as string,
}));

export default function DashboardPage() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="xl:col-span-2 space-y-6">
          {/* Hero Banner - matching CryptoZone bubles card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-[rgba(99,102,241,0.15)] p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl translate-y-1/2" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">
                  Accept Crypto Payments Instantly
                </h2>
                <p className="text-slate-400 mt-2 max-w-lg text-sm">
                  Accept 100+ cryptocurrencies — all payments auto-converted to USDT TRC-20. No volatility risk, instant settlement.
                </p>
                <Link
                  href="/integration"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all"
                >
                  Get API Key
                </Link>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
                  <svg className="w-16 h-16 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Cards Slider */}
          <BalanceCardSlider />

          {/* Payment Volume Chart - matching Market Chart card */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="flex items-start justify-between flex-wrap gap-4 p-6 pb-0">
              <div>
                <h2 className="text-lg font-bold text-white">Payment Volume</h2>
                <div className="flex flex-wrap gap-6 mt-3">
                  <div>
                    <span className="text-xs text-slate-500">This Month</span>
                    <h4 className="text-lg font-bold text-slate-100">$29,999.00</h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Transactions</span>
                    <h4 className="text-lg font-bold text-slate-100">480 <sub className="text-xs text-emerald-400">+12%</sub></h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Avg. Size</span>
                    <h4 className="text-lg font-bold text-slate-100">$62.50</h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Volume</span>
                    <h4 className="text-lg font-bold text-slate-100">175k</h4>
                  </div>
                </div>
              </div>
              {/* Dropdown - matching CryptoZone custom-dropdown */}
              <button aria-label="More options" className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                <svg width="6" height="20" viewBox="0 0 6 20" fill="none">
                  <circle cx="3" cy="3" r="2" fill="currentColor"/>
                  <circle cx="3" cy="10" r="2" fill="currentColor"/>
                  <circle cx="3" cy="17" r="2" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <PaymentVolumeChart />
            </div>
          </div>

          {/* Bottom row - Assets Allocation + Market Previews + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Crypto Allocation - matching Assets Allocation card */}
            <div className="md:col-span-5">
              <div className="glass-card p-0 overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-0">
                  <h2 className="text-base font-bold text-white">Crypto Allocation</h2>
                  <button aria-label="More options" className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                    <svg width="6" height="20" viewBox="0 0 6 20" fill="none">
                      <circle cx="3" cy="3" r="2" fill="currentColor"/>
                      <circle cx="3" cy="10" r="2" fill="currentColor"/>
                      <circle cx="3" cy="17" r="2" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <div className="p-5 pt-2">
                  <CryptoAllocationChart />
                </div>
              </div>
            </div>

            {/* Market Previews - matching CryptoZone market-previews card */}
            <div className="md:col-span-4">
              <div className="glass-card p-0 overflow-hidden">
                <div className="p-5 pb-0">
                  <h2 className="text-base font-bold text-white">Supported Crypto</h2>
                </div>
                <div className="pt-2">
                  {cryptoPreviews.map((crypto, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${crypto.bg} ${crypto.text}`}>
                          {crypto.name.slice(0, 2)}
                        </span>
                        <div>
                          <h6 className="text-sm font-semibold text-slate-200">{crypto.name}/USD</h6>
                          <span className="text-xs text-slate-500">Payments</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <h6 className="text-sm font-semibold text-slate-200">{crypto.price}</h6>
                        <span className={`text-xs ${crypto.up ? 'text-emerald-400' : 'text-red-400'}`}>
                          {crypto.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats card - matching email-susb */}
            <div className="md:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-5 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">1,247</h3>
                <h5 className="text-sm text-white/70 mt-1">Total Merchants Active</h5>
                <Link
                  href="/integration"
                  className="inline-flex items-center justify-center mt-4 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
                >
                  Start Accepting
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Withdraw Form - matching OrderForm */}
          <QuickWithdrawForm />

          {/* Recent Payments - matching Order Book card */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(99,102,241,0.08)]">
              <h2 className="text-sm font-bold text-white">
                Recent Payments <span className="text-slate-500">(Live)</span>
              </h2>
            </div>
            <div className="p-2">
              {/* Tab navigation - matching buy-sell style-1 */}
              <div className="flex border-b border-[rgba(99,102,241,0.05)] mb-2">
                <button className="flex-1 py-2 text-xs font-medium text-indigo-400 border-b border-indigo-500">
                  Incoming
                </button>
                <button className="flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-400 transition-colors">
                  Outgoing
                </button>
              </div>

              {/* List Header */}
              <div className="flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>ID</span>
                <span>Amount</span>
                <span className="text-right">Status</span>
              </div>

              {/* List rows - matching list-table */}
              <div className="space-y-0.5">
                {recentPayments.slice(0, 8).map((payment, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors relative"
                  >
                    <span className="text-xs text-slate-400 font-mono">{payment.id}</span>
                    <span className="text-xs text-slate-300 font-medium">${payment.amount}</span>
                    <span className={`text-xs text-right ${
                      payment.status === 'confirmed' ? 'text-emerald-400' :
                      payment.status === 'pending' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {payment.status}
                    </span>
                    {/* Background layer - matching bg-layer */}
                    <div className={`absolute inset-0 rounded-lg opacity-5 ${
                      payment.status === 'confirmed' ? 'bg-emerald-500' :
                      payment.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} style={{ width: `${30 + Math.random() * 60}%` }} />
                  </div>
                ))}
              </div>

              {/* Bottom info */}
              <div className="px-3 py-2 mt-1 border-t border-[rgba(99,102,241,0.05)]">
                <h6 className="text-xs font-semibold text-emerald-400">
                  +$12,847.65 today
                  <svg className="inline w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </h6>
              </div>
            </div>
          </div>

          {/* Server Status - matching server-chart card */}
          <div className="glass-card p-0 overflow-hidden">
            <div className="p-5 pb-0">
              <h2 className="text-sm font-bold text-white">Gateway Status</h2>
            </div>
            <div className="p-4 pt-2">
              <ServerStatusBar />
              <div className="flex items-center justify-between mt-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500">Network</span>
                  <h4 className="text-xs font-semibold text-slate-200">Mainnet</h4>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">API</span>
                  <h4 className="text-xs font-semibold text-slate-200">api.mycrypto.co.in</h4>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">
                    <svg className="inline w-3 h-3 text-emerald-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200">99.9%</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
