'use client';

import React, { useState, useEffect } from 'react';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import api, { type Payment } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

const mockPayments: Payment[] = [
  { id: 'pay_001', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', orderId: 'ORD-4521', crypto: 'BTC', amount: 0.05, amountUsd: 3250, status: 'confirmed', walletAddress: 'bc1q...xk4f', confirmations: 3, requiredConfirmations: 3, createdAt: '2026-03-19T09:30:00Z', expiresAt: '2026-03-19T10:00:00Z' },
  { id: 'pay_002', merchantId: 'merch_004', merchantName: 'GameFi Payments', orderId: 'ORD-8812', crypto: 'ETH', amount: 2.5, amountUsd: 8750, status: 'confirming', walletAddress: '0x742...8f3b', confirmations: 8, requiredConfirmations: 12, createdAt: '2026-03-19T09:15:00Z', expiresAt: '2026-03-19T09:45:00Z' },
  { id: 'pay_003', merchantId: 'merch_002', merchantName: 'Digital Vault Exchange', orderId: 'ORD-3391', crypto: 'USDT', amount: 500, amountUsd: 500, status: 'completed', walletAddress: '0x1234...5678', confirmations: 12, requiredConfirmations: 12, createdAt: '2026-03-19T08:45:00Z', expiresAt: '2026-03-19T09:15:00Z' },
  { id: 'pay_004', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', orderId: 'ORD-5501', crypto: 'SOL', amount: 50, amountUsd: 7500, status: 'awaiting_payment', walletAddress: '5Ky7...9a2m', confirmations: 0, requiredConfirmations: 1, createdAt: '2026-03-19T09:40:00Z', expiresAt: '2026-03-19T10:10:00Z' },
  { id: 'pay_005', merchantId: 'merch_004', merchantName: 'GameFi Payments', orderId: 'ORD-9923', crypto: 'BTC', amount: 0.01, amountUsd: 650, status: 'awaiting_payment', walletAddress: 'bc1q...9h5y', confirmations: 0, requiredConfirmations: 3, createdAt: '2026-03-19T09:45:00Z', expiresAt: '2026-03-19T10:15:00Z' },
  { id: 'pay_006', merchantId: 'merch_002', merchantName: 'Digital Vault Exchange', orderId: 'ORD-1122', crypto: 'ETH', amount: 0.5, amountUsd: 1750, status: 'expired', walletAddress: '0xabc...def0', confirmations: 0, requiredConfirmations: 12, createdAt: '2026-03-19T07:00:00Z', expiresAt: '2026-03-19T07:30:00Z' },
  { id: 'pay_007', merchantId: 'merch_005', merchantName: 'NFT Marketplace Inc', orderId: 'ORD-7766', crypto: 'USDT', amount: 1000, amountUsd: 1000, status: 'failed', walletAddress: '0x9876...5432', confirmations: 0, requiredConfirmations: 12, createdAt: '2026-03-19T06:30:00Z', expiresAt: '2026-03-19T07:00:00Z' },
  { id: 'pay_008', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', orderId: 'ORD-2244', crypto: 'SOL', amount: 100, amountUsd: 15000, status: 'completed', walletAddress: '5Ky7...3bFd', confirmations: 1, requiredConfirmations: 1, createdAt: '2026-03-19T05:00:00Z', expiresAt: '2026-03-19T05:30:00Z' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<Payment[]>(endpoints.payments.list);
        setPayments(res.data);
      } catch {
        setPayments(mockPayments);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = statusFilter ? payments.filter((p) => p.status === statusFilter) : payments;

  const statusCounts: Record<string, number> = {};
  payments.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getConfirmProgress = (current: number, required: number) => {
    return Math.min(100, (current / required) * 100);
  };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time payment monitoring across all merchants</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-emerald-400" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Updates
          </span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Awaiting Payment', key: 'awaiting_payment', icon: 'hourglass_empty', color: '#f59e0b' },
          { label: 'Confirming', key: 'confirming', icon: 'pending', color: '#3b82f6' },
          { label: 'Confirmed', key: 'confirmed', icon: 'check_circle', color: '#10b981' },
          { label: 'Completed', key: 'completed', icon: 'done_all', color: '#10b981' },
          { label: 'Expired/Failed', key: 'expired', icon: 'cancel', color: '#f43f5e' },
        ].map((item) => (
          <div key={item.key} className="cz-card-hover p-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === item.key ? '' : item.key)}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons text-lg" style={{ color: item.color }}>{item.icon}</span>
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{statusCounts[item.key] || 0}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="cz-card overflow-hidden">
        <table className="cz-table">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Merchant</th>
              <th>Crypto</th>
              <th className="text-right">Amount</th>
              <th>Confirmations</th>
              <th>Status</th>
              <th>Timer</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">No payments found</td></tr>
            ) : (
              filtered.map((pay) => (
                <tr key={pay.id}>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-white">{pay.orderId}</p>
                      <p className="text-xs text-slate-500 font-mono">{pay.id}</p>
                    </div>
                  </td>
                  <td className="text-slate-300">{pay.merchantName}</td>
                  <td>
                    <span className="text-sm font-bold" style={{ color: { BTC: '#f59e0b', ETH: '#818cf8', USDT: '#10b981', SOL: '#e879f9' }[pay.crypto] || '#fff' }}>
                      {pay.crypto}
                    </span>
                  </td>
                  <td className="text-right">
                    <p className="text-white font-medium">{pay.amount} {pay.crypto}</p>
                    <p className="text-xs text-slate-500">${pay.amountUsd.toLocaleString()}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden" style={{ maxWidth: '60px' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${getConfirmProgress(pay.confirmations, pay.requiredConfirmations)}%`,
                            background: pay.confirmations >= pay.requiredConfirmations ? '#10b981' : '#3b82f6',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {pay.confirmations}/{pay.requiredConfirmations}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(pay.status)} dot size="sm">
                      {pay.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td>
                    {['awaiting_payment', 'confirming'].includes(pay.status) ? (
                      <span className="text-xs text-amber-400 font-mono">{getTimeRemaining(pay.expiresAt)}</span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                  <td className="text-slate-400 text-sm whitespace-nowrap">
                    {new Date(pay.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
