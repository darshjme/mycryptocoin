'use client';

import React, { useState, useEffect } from 'react';
import RevenueChart from '@/components/dashboard/RevenueChart';
import RevenueBreakdown from '@/components/revenue/RevenueBreakdown';
import api from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

interface RevenueData {
  totalRevenue: number;
  revenueByCrypto: Array<{ crypto: string; amount: number; percentage: number }>;
  revenueByPeriod: Array<{ date: string; amount: number; fees: number }>;
  topMerchants: Array<{ id: string; name: string; volume: number; fees: number }>;
}

const mockRevenueData: RevenueData = {
  totalRevenue: 128904,
  revenueByCrypto: [
    { crypto: 'USDT', amount: 58006, percentage: 45 },
    { crypto: 'BTC', amount: 32226, percentage: 25 },
    { crypto: 'ETH', amount: 25781, percentage: 20 },
    { crypto: 'SOL', amount: 12891, percentage: 10 },
  ],
  revenueByPeriod: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 3000) + 3000,
      fees: Math.floor(Math.random() * 300) + 300,
    };
  }),
  topMerchants: [
    { id: 'merch_004', name: 'GameFi Payments', volume: 2340000, fees: 23400 },
    { id: 'merch_001', name: 'CryptoShop Pro', volume: 1250000, fees: 12500 },
    { id: 'merch_002', name: 'Digital Vault Exchange', volume: 890000, fees: 8900 },
    { id: 'merch_005', name: 'NFT Marketplace Inc', volume: 450000, fees: 4500 },
  ],
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<RevenueData>(endpoints.revenue.summary, { period });
        setData(res.data);
      } catch {
        setData(mockRevenueData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading revenue data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Fee revenue analytics and merchant performance</p>
        </div>
        <div className="cz-tabs">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`cz-tab ${period === p ? 'active' : ''}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="cz-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-emerald-400 text-lg">paid</span>
            <span className="text-xs text-slate-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${data.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-1">+15.3% vs last period</p>
        </div>
        <div className="cz-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-blue-400 text-lg">show_chart</span>
            <span className="text-xs text-slate-400">Avg Daily Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${Math.floor(data.totalRevenue / data.revenueByPeriod.length).toLocaleString()}
          </p>
        </div>
        <div className="cz-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-purple-400 text-lg">store</span>
            <span className="text-xs text-slate-400">Top Merchant Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${data.topMerchants[0]?.fees.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{data.topMerchants[0]?.name}</p>
        </div>
        <div className="cz-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-icons text-amber-400 text-lg">currency_bitcoin</span>
            <span className="text-xs text-slate-400">Top Crypto Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">${data.revenueByCrypto[0]?.amount.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">{data.revenueByCrypto[0]?.crypto} ({data.revenueByCrypto[0]?.percentage}%)</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart data={data.revenueByPeriod} />
        <RevenueBreakdown data={data.revenueByCrypto} totalRevenue={data.totalRevenue} />
      </div>

      {/* Top Merchants by Volume */}
      <div className="cz-card overflow-hidden">
        <div className="cz-card-header">
          <h3 className="cz-heading">Top Merchants by Volume</h3>
        </div>
        <table className="cz-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Merchant</th>
              <th className="text-right">Total Volume</th>
              <th className="text-right">Fees Generated</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {data.topMerchants.map((merchant, i) => {
              const totalVolume = data.topMerchants.reduce((sum, m) => sum + m.volume, 0);
              const share = (merchant.volume / totalVolume) * 100;
              return (
                <tr key={merchant.id}>
                  <td>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500/20 text-amber-400' :
                      i === 1 ? 'bg-slate-400/20 text-slate-300' :
                      i === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/5 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                        {merchant.name.charAt(0)}
                      </div>
                      <span className="text-white font-medium">{merchant.name}</span>
                    </div>
                  </td>
                  <td className="text-right text-white font-medium">${merchant.volume.toLocaleString()}</td>
                  <td className="text-right text-emerald-400 font-medium">${merchant.fees.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden" style={{ maxWidth: '80px' }}>
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
