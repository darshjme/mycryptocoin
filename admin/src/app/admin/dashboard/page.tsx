'use client';

import { useState } from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import VolumeChart from '@/components/charts/VolumeChart';
import RevenueChart from '@/components/charts/RevenueChart';
import DoughnutChart from '@/components/charts/DoughnutChart';

const cryptoIcons: Record<string, { color: string; bg: string }> = {
  BTC: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  ETH: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' },
  USDT: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  SOL: { color: '#e879f9', bg: 'rgba(232, 121, 249, 0.12)' },
};

export default function DashboardPage() {
  const { stats, health, volumeData, revenueData, loading } = useAdminStats();
  const [volumePeriod, setVolumePeriod] = useState<'24h' | '7d' | '30d'>('7d');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Merchants', value: stats?.totalMerchants || 0, icon: 'store', color: '#6366f1', change: `${stats?.activeMerchants || 0} active`, changeColor: '#10b981' },
    { title: 'Volume (24h)', value: `$${(Number(stats?.volume24h || 0) / 1000).toFixed(1)}K`, icon: 'show_chart', color: '#3b82f6', change: '+12.5%', changeColor: '#10b981' },
    { title: 'Fees Earned (24h) USDT', value: `$${Number(stats?.feesEarned24h || 0).toFixed(2)}`, icon: 'paid', color: '#10b981', change: '+8.2%', changeColor: '#10b981' },
    { title: 'Active Payments', value: stats?.activePayments || 0, icon: 'payments', color: '#f59e0b', change: `${stats?.pendingWithdrawals || 0} pending WD`, changeColor: '#f59e0b' },
  ];

  return (
    <div className="animate-in">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (8 cols) - like CryptoZone col-xl-8 */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Hero Card - CryptoZone bubles card style */}
          <div className="cz-hero-card">
            <div className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
                  <p className="text-slate-400 text-sm max-w-md">
                    Monitor your payment gateway performance, merchant activity, and blockchain health in real-time.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="cz-badge-success">All Systems Operational</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">{(stats?.totalTransactions || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance/Stat Cards row - CryptoZone BalanceCardSlider style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className="cz-card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                    <span className="material-icons text-xl" style={{ color: card.color }}>{card.icon}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-1">{card.title}</p>
                <h3 className="text-xl font-bold text-white">{card.value}</h3>
                <p className="text-xs mt-1" style={{ color: card.changeColor }}>{card.change}</p>
              </div>
            ))}
          </div>

          {/* Market/Volume Chart - CryptoZone Market Chart card style */}
          <div className="cz-card">
            <div className="cz-card-header no-border flex-wrap gap-3">
              <div>
                <h2 className="cz-heading">Volume Chart</h2>
                <div className="flex items-center gap-6 mt-2">
                  <div>
                    <span className="text-xs text-slate-400">Volume (7d)</span>
                    <h4 className="text-lg font-bold text-white">${((stats?.volume7d || 0) / 1000000).toFixed(2)}M</h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Volume (30d)</span>
                    <h4 className="text-lg font-bold text-white">${((stats?.volume30d || 0) / 1000000).toFixed(2)}M</h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Fees (7d) USDT</span>
                    <h4 className="text-lg font-bold text-white">${((stats?.feesEarned7d || 0) / 1000).toFixed(1)}K</h4>
                  </div>
                </div>
              </div>
              <div className="cz-tabs">
                {(['24h', '7d', '30d'] as const).map((p) => (
                  <button key={p} onClick={() => setVolumePeriod(p)} className={`cz-tab ${volumePeriod === p ? 'active' : ''}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="cz-card-body">
              <VolumeChart data={volumeData} />
            </div>
          </div>

          {/* Bottom row: Assets + Market Previews + Stats - CryptoZone layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Assets Allocation - CryptoZone donut chart card */}
            <div className="col-span-12 lg:col-span-5">
              <div className="cz-card">
                <div className="cz-card-header no-border">
                  <h2 className="cz-heading">Volume by Crypto</h2>
                </div>
                <div className="cz-card-body text-center pt-0">
                  <DoughnutChart />
                  <div className="mt-4 space-y-2">
                    {[
                      { name: 'USDT (45%)', color: '#10b981', amount: '$5.8M' },
                      { name: 'BTC (25%)', color: '#f59e0b', amount: '$3.2M' },
                      { name: 'ETH (20%)', color: '#818cf8', amount: '$2.6M' },
                      { name: 'SOL (10%)', color: '#e879f9', amount: '$1.3M' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="w-3 h-3 rounded" style={{ background: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold text-white">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Previews - CryptoZone market-previews card */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4">
              <div className="cz-card">
                <div className="cz-card-header no-border">
                  <h2 className="cz-heading">Crypto Status</h2>
                </div>
                <div className="pt-0 pb-2">
                  {Object.entries(cryptoIcons).map(([crypto, style], i) => (
                    <div key={crypto} className="cz-preview-item">
                      <div className="flex items-center gap-3">
                        <span className="cz-icon-box-sm rounded-lg" style={{ background: style.bg }}>
                          <span className="text-xs font-bold" style={{ color: style.color }}>{crypto.charAt(0)}</span>
                        </span>
                        <div>
                          <h6 className="text-sm font-medium text-white">{crypto}</h6>
                          <span className="text-xs text-slate-500">
                            {health?.blockchain[crypto.toLowerCase() as keyof typeof health.blockchain]
                              ? (health.blockchain[crypto.toLowerCase() as keyof typeof health.blockchain] as { status: string }).status
                              : 'unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`cz-status-dot inline-block ${
                          health?.blockchain[crypto.toLowerCase() as keyof typeof health.blockchain]
                            ? (health.blockchain[crypto.toLowerCase() as keyof typeof health.blockchain] as { status: string }).status === 'healthy'
                              ? 'healthy'
                              : 'degraded'
                            : 'down'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats - CryptoZone email-subs card style */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <div className="cz-card" style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)' }}>
                <div className="p-5 text-center">
                  <span className="material-icons text-4xl text-indigo-300 mb-3">pending_actions</span>
                  <h3 className="text-3xl font-bold text-white">{stats?.pendingMerchants || 0}</h3>
                  <h5 className="text-sm text-indigo-200 mt-1">Pending Approvals</h5>
                  <a href="/admin/merchants" className="cz-btn-primary cz-btn-sm mt-4 inline-flex">
                    Review
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) - CryptoZone col-xl-4 style */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Revenue Mini Chart - like CryptoZone buy/sell card */}
          <div className="cz-card">
            <div className="cz-card-header no-border">
              <h2 className="cz-heading">Revenue (30d)</h2>
            </div>
            <div className="cz-card-body pt-0">
              <RevenueChart data={revenueData} />
              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span className="text-xs text-slate-400">Total Fees</span>
                  <h4 className="text-lg font-bold text-white">${((stats?.feesEarned30d || 0) / 1000).toFixed(1)}K</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Avg Daily</span>
                  <h4 className="text-lg font-bold text-white">${((stats?.feesEarned30d || 0) / 30 / 1000).toFixed(1)}K</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity - CryptoZone Order Book style */}
          <div className="cz-card">
            <div className="cz-card-header">
              <h2 className="cz-heading">Recent Activity</h2>
            </div>
            <div className="cz-card-body pt-0 pb-3 max-h-[380px] overflow-y-auto">
              {[
                { icon: 'person_add', text: 'New merchant: BlockPay Solutions', time: '10m ago', color: '#3b82f6' },
                { icon: 'check_circle', text: 'Payment confirmed: 0.05 BTC', time: '15m ago', color: '#10b981' },
                { icon: 'account_balance', text: 'Withdrawal processed: 5 ETH', time: '30m ago', color: '#f59e0b' },
                { icon: 'warning', text: 'SOL sync degraded', time: '1h ago', color: '#f43f5e' },
                { icon: 'verified', text: 'Merchant approved: GameFi Pay', time: '2h ago', color: '#10b981' },
                { icon: 'payments', text: 'New payment: 500 USDT', time: '2h ago', color: '#818cf8' },
                { icon: 'cancel', text: 'Payment expired: Order #3892', time: '3h ago', color: '#64748b' },
                { icon: 'check_circle', text: 'Withdrawal completed: 0.5 BTC', time: '4h ago', color: '#10b981' },
                { icon: 'person_add', text: 'New merchant: NFT Hub', time: '5h ago', color: '#3b82f6' },
                { icon: 'chat', text: 'WhatsApp OTP sent to +91 98765', time: '5h ago', color: '#22c55e' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span className="material-icons text-lg mt-0.5" style={{ color: item.color }}>{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{item.text}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health - CryptoZone Server Status card style */}
          <div className="cz-card">
            <div className="cz-card-header no-border">
              <h2 className="cz-heading">System Health</h2>
            </div>
            <div className="cz-card-body pt-0">
              <div className="space-y-3">
                {[
                  { name: 'API Server', status: health?.api.status || 'healthy', detail: `${health?.api.latency || 0}ms latency` },
                  { name: 'Database', status: health?.database.status || 'healthy', detail: `${health?.database.connections || 0} connections` },
                  { name: 'Redis Cache', status: health?.redis.status || 'healthy', detail: health?.redis.memoryUsage || 'N/A' },
                  { name: 'WhatsApp', status: health?.whatsapp.status === 'connected' ? 'healthy' : 'down', detail: health?.whatsapp.status || 'disconnected' },
                ].map((service, i) => (
                  <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      <span className={`cz-status-dot ${service.status}`} />
                      <span className="text-sm text-white">{service.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{service.detail}</span>
                  </div>
                ))}
              </div>

              {/* CryptoZone server-status footer style */}
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span className="text-xs text-slate-400">Uptime</span>
                  <h4 className="text-sm font-semibold text-white">99.98%</h4>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Response</span>
                  <h4 className="text-sm font-semibold text-white">{health?.api.latency || 0}ms</h4>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Status</span>
                  <h4 className="text-sm font-semibold text-emerald-400">Online</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
