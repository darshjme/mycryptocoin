'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMerchants } from '@/hooks/useMerchants';
import Badge, { getStatusVariant } from '@/components/ui/Badge';

export default function MerchantsPage() {
  const { merchants, loading, pagination, updateFilters, approveMerchant, suspendMerchant, activateMerchant } = useMerchants();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await approveMerchant(id);
    setActionLoading(null);
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(id);
    await suspendMerchant(id, 'Suspended by admin');
    setActionLoading(null);
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    await activateMerchant(id);
    setActionLoading(null);
  };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchants</h1>
          <p className="text-sm text-slate-400 mt-1">Manage all registered merchants</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="cz-badge-info">{merchants.length} total</span>
          <span className="cz-badge-success">{merchants.filter((m) => m.status === 'active').length} active</span>
          <span className="cz-badge-warning">{merchants.filter((m) => m.status === 'pending').length} pending</span>
        </div>
      </div>

      {/* Filters */}
      <div className="cz-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search merchants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cz-input pl-10"
              />
            </div>
          </div>
          <div className="cz-tabs">
            {[
              { label: 'All', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Pending', value: 'pending' },
              { label: 'Suspended', value: 'suspended' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`cz-tab ${statusFilter === tab.value ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="cz-card overflow-hidden">
        <table className="cz-table">
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Contact</th>
              <th>Status</th>
              <th className="text-right">Volume</th>
              <th className="text-right">Transactions</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} /></td>
                  ))}
                </tr>
              ))
            ) : filteredMerchants.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500">No merchants found</td>
              </tr>
            ) : (
              filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="group">
                  <td>
                    <Link href={`/admin/merchants/${merchant.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.15)' }}>
                        {merchant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{merchant.name}</p>
                        <p className="text-xs text-slate-500">{merchant.businessType}</p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <p className="text-sm text-slate-300">{merchant.email}</p>
                    <p className="text-xs text-slate-500">{merchant.whatsapp}</p>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(merchant.status)} dot>
                      {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <span className="text-white font-medium">${merchant.totalVolume.toLocaleString()}</span>
                  </td>
                  <td className="text-right text-slate-400">
                    {merchant.totalTransactions.toLocaleString()}
                  </td>
                  <td className="text-slate-400 text-sm">
                    {new Date(merchant.joinedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/merchants/${merchant.id}`}
                        className="cz-btn-outline cz-btn-xs"
                      >
                        <span className="material-icons text-sm">visibility</span>
                        View
                      </Link>
                      {merchant.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(merchant.id)}
                          disabled={actionLoading === merchant.id}
                          className="cz-btn-success cz-btn-xs"
                        >
                          {actionLoading === merchant.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span className="material-icons text-sm">check</span>
                          )}
                          Approve
                        </button>
                      )}
                      {merchant.status === 'active' && (
                        <button
                          onClick={() => handleSuspend(merchant.id)}
                          disabled={actionLoading === merchant.id}
                          className="cz-btn-danger cz-btn-xs"
                        >
                          <span className="material-icons text-sm">block</span>
                          Suspend
                        </button>
                      )}
                      {merchant.status === 'suspended' && (
                        <button
                          onClick={() => handleActivate(merchant.id)}
                          disabled={actionLoading === merchant.id}
                          className="cz-btn-success cz-btn-xs"
                        >
                          <span className="material-icons text-sm">play_arrow</span>
                          Activate
                        </button>
                      )}
                    </div>
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
