'use client';

import React from 'react';

const dailyReport = [
  { name: 'BTC', payments: 342, volume: '$18,357', fees: '$91.78', netVolume: '$18,265', change: '+12.5%', positive: true },
  { name: 'ETH', payments: 256, volume: '$9,178', fees: '$45.89', netVolume: '$9,132', change: '+8.2%', positive: true },
  { name: 'USDT', payments: 189, volume: '$15,240', fees: '$76.20', netVolume: '$15,164', change: '+22.1%', positive: true },
  { name: 'LTC', payments: 87, volume: '$3,098', fees: '$15.49', netVolume: '$3,083', change: '-3.1%', positive: false },
  { name: 'SOL', payments: 64, volume: '$8,404', fees: '$42.02', netVolume: '$8,362', change: '+45.6%', positive: true },
  { name: 'DOGE', payments: 45, volume: '$1,230', fees: '$6.15', netVolume: '$1,224', change: '+5.3%', positive: true },
  { name: 'XRP', payments: 32, volume: '$2,850', fees: '$14.25', netVolume: '$2,836', change: '-1.2%', positive: false },
  { name: 'ADA', payments: 28, volume: '$945', fees: '$4.73', netVolume: '$940', change: '+3.8%', positive: true },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Daily Report - matching Reports component */}
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-5 border-b border-[rgba(99,102,241,0.08)]">
          <h4 className="text-lg font-bold text-white">Daily Fee Report</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.08)]">
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Crypto</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Payments</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Volume</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Fees Collected</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Net Volume</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody>
              {dailyReport.map((item, i) => (
                <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-center text-sm text-slate-500">{i + 1}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">{item.name}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-slate-300">{item.payments}</td>
                  <td className="px-5 py-3 text-right text-sm text-slate-300">{item.volume}</td>
                  <td className="px-5 py-3 text-right text-sm text-slate-300">{item.fees}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-slate-200">{item.netVolume}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md ${
                      item.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {item.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two column tables - matching Reports top gainers / losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-0 overflow-hidden">
          <div className="p-5 border-b border-[rgba(99,102,241,0.08)]">
            <h4 className="text-base font-bold text-white">Top Performing Crypto</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.06)]">
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Crypto</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Volume</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.filter(d => d.positive).map((item, i) => (
                  <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-center text-sm text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3 text-sm text-indigo-400 font-semibold">{item.name}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-300">{item.volume}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400">{item.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-0 overflow-hidden">
          <div className="p-5 border-b border-[rgba(99,102,241,0.08)]">
            <h4 className="text-base font-bold text-white">Declining Crypto</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(99,102,241,0.06)]">
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Crypto</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Volume</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.filter(d => !d.positive).map((item, i) => (
                  <tr key={i} className="border-b border-[rgba(99,102,241,0.04)] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-center text-sm text-slate-500">{i + 1}</td>
                    <td className="px-5 py-3 text-sm text-indigo-400 font-semibold">{item.name}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-300">{item.volume}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-red-500/10 text-red-400">{item.change}</span>
                    </td>
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
