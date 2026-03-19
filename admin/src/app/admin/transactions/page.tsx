'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import api, { type Transaction } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';

const mockTransactions: Transaction[] = [
  { id: 'tx_001', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', type: 'payment', crypto: 'BTC', amount: 0.05, amountUsd: 3250, status: 'completed', txHash: '0xabc...123', createdAt: '2026-03-19T09:30:00Z', confirmedAt: '2026-03-19T09:45:00Z' },
  { id: 'tx_002', merchantId: 'merch_004', merchantName: 'GameFi Payments', type: 'payment', crypto: 'ETH', amount: 2.5, amountUsd: 8750, status: 'confirmed', txHash: '0xdef...456', createdAt: '2026-03-19T09:15:00Z', confirmedAt: '2026-03-19T09:20:00Z' },
  { id: 'tx_003', merchantId: 'merch_002', merchantName: 'Digital Vault Exchange', type: 'withdrawal', crypto: 'USDT', amount: 25000, amountUsd: 25000, status: 'completed', txHash: '0xghi...789', createdAt: '2026-03-19T08:45:00Z', confirmedAt: '2026-03-19T09:00:00Z' },
  { id: 'tx_004', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', type: 'payment', crypto: 'SOL', amount: 50, amountUsd: 7500, status: 'pending', createdAt: '2026-03-19T08:30:00Z' },
  { id: 'tx_005', merchantId: 'merch_004', merchantName: 'GameFi Payments', type: 'deposit', crypto: 'BTC', amount: 1.2, amountUsd: 78000, status: 'completed', txHash: '0xjkl...012', createdAt: '2026-03-19T08:00:00Z', confirmedAt: '2026-03-19T08:30:00Z' },
  { id: 'tx_006', merchantId: 'merch_002', merchantName: 'Digital Vault Exchange', type: 'payment', crypto: 'ETH', amount: 0.8, amountUsd: 2800, status: 'failed', createdAt: '2026-03-19T07:30:00Z' },
  { id: 'tx_007', merchantId: 'merch_005', merchantName: 'NFT Marketplace Inc', type: 'payment', crypto: 'USDT', amount: 500, amountUsd: 500, status: 'expired', createdAt: '2026-03-19T06:00:00Z' },
  { id: 'tx_008', merchantId: 'merch_001', merchantName: 'CryptoShop Pro', type: 'withdrawal', crypto: 'BTC', amount: 0.1, amountUsd: 6500, status: 'completed', txHash: '0xmno...345', createdAt: '2026-03-18T22:00:00Z', confirmedAt: '2026-03-18T22:30:00Z' },
  { id: 'tx_009', merchantId: 'merch_004', merchantName: 'GameFi Payments', type: 'payment', crypto: 'SOL', amount: 200, amountUsd: 30000, status: 'completed', txHash: '5kL...m2n', createdAt: '2026-03-18T20:00:00Z', confirmedAt: '2026-03-18T20:15:00Z' },
  { id: 'tx_010', merchantId: 'merch_002', merchantName: 'Digital Vault Exchange', type: 'deposit', crypto: 'ETH', amount: 10, amountUsd: 35000, status: 'completed', txHash: '0xpqr...678', createdAt: '2026-03-18T18:00:00Z', confirmedAt: '2026-03-18T18:20:00Z' },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cryptoFilter, setCryptoFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<Transaction[]>(endpoints.transactions.list);
        setTransactions(res.data);
      } catch {
        setTransactions(mockTransactions);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchSearch = !search || tx.merchantName.toLowerCase().includes(search.toLowerCase()) || tx.id.includes(search) || (tx.txHash && tx.txHash.includes(search));
    const matchStatus = !statusFilter || tx.status === statusFilter;
    const matchCrypto = !cryptoFilter || tx.crypto === cryptoFilter;
    const matchType = !typeFilter || tx.type === typeFilter;
    return matchSearch && matchStatus && matchCrypto && matchType;
  });

  const typeColors: Record<string, string> = { payment: '#3b82f6', withdrawal: '#f59e0b', deposit: '#10b981' };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-slate-400 mt-1">All transactions across all merchants</p>
        </div>
        <button className="cz-btn-outline cz-btn-sm">
          <span className="material-icons text-sm">download</span>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="cz-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search by merchant, TX ID, hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cz-input pl-10"
              />
            </div>
          </div>
          <select
            value={cryptoFilter}
            onChange={(e) => setCryptoFilter(e.target.value)}
            className="cz-input w-auto"
          >
            <option value="">All Cryptos</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="USDT">USDT</option>
            <option value="SOL">SOL</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="cz-input w-auto"
          >
            <option value="">All Types</option>
            <option value="payment">Payment</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="deposit">Deposit</option>
          </select>
          <div className="cz-tabs">
            {[
              { label: 'All', value: '' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ].map((tab) => (
              <button key={tab.value} onClick={() => setStatusFilter(tab.value)} className={`cz-tab ${statusFilter === tab.value ? 'active' : ''}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cz-card overflow-hidden">
        <table className="cz-table">
          <thead>
            <tr>
              <th>TX ID</th>
              <th>Merchant</th>
              <th>Type</th>
              <th>Crypto</th>
              <th className="text-right">Amount</th>
              <th className="text-right">USD</th>
              <th>Status</th>
              <th>Date</th>
              <th>TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j}><div className="h-4 bg-white/5 rounded animate-pulse" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-slate-500">No transactions found</td></tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-xs text-slate-400">{tx.id}</td>
                  <td className="text-white font-medium">{tx.merchantName}</td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: `${typeColors[tx.type]}15`, color: typeColors[tx.type] }}>
                      <span className="material-icons text-xs">
                        {tx.type === 'payment' ? 'south_west' : tx.type === 'withdrawal' ? 'north_east' : 'south'}
                      </span>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-semibold" style={{ color: { BTC: '#f59e0b', ETH: '#818cf8', USDT: '#10b981', SOL: '#e879f9' }[tx.crypto] || '#fff' }}>
                      {tx.crypto}
                    </span>
                  </td>
                  <td className="text-right text-white font-medium">{tx.amount}</td>
                  <td className="text-right text-slate-400">${tx.amountUsd.toLocaleString()}</td>
                  <td>
                    <Badge variant={getStatusVariant(tx.status)} dot size="sm">
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="text-slate-400 text-sm whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="font-mono text-xs text-slate-500">
                    {tx.txHash ? (
                      <span className="cursor-pointer hover:text-indigo-400 transition-colors" title={tx.txHash}>
                        {tx.txHash}
                      </span>
                    ) : '-'}
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
