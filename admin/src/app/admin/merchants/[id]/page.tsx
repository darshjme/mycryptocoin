'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMerchants } from '@/hooks/useMerchants';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import type { Merchant } from '@/lib/api';

interface MerchantFullDetail extends Merchant {
  wallets: Array<{ crypto: string; address: string; balance: number }>;
  apiKeys: Array<{ id: string; label: string; prefix: string; createdAt: string; lastUsed: string; active: boolean }>;
  activityLog: Array<{ id: string; action: string; details: string; ip: string; timestamp: string }>;
}

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getMerchantDetail, approveMerchant, suspendMerchant, activateMerchant } = useMerchants();
  const [merchant, setMerchant] = useState<MerchantFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'wallets' | 'apikeys' | 'activity'>('overview');

  useEffect(() => {
    const load = async () => {
      const data = await getMerchantDetail(params.id as string);
      setMerchant(data as MerchantFullDetail);
      setLoading(false);
    };
    load();
  }, [params.id, getMerchantDetail]);

  const handleAction = async (action: 'approve' | 'suspend' | 'activate') => {
    if (!merchant) return;
    setActionLoading(true);
    if (action === 'approve') await approveMerchant(merchant.id);
    else if (action === 'suspend') await suspendMerchant(merchant.id, 'Admin action');
    else await activateMerchant(merchant.id);
    const data = await getMerchantDetail(merchant.id);
    setMerchant(data as MerchantFullDetail);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading merchant...</span>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-20">
        <span className="material-icons text-5xl text-slate-600 mb-4">error_outline</span>
        <h2 className="text-xl font-semibold text-white mb-2">Merchant not found</h2>
        <button onClick={() => router.back()} className="cz-btn-outline mt-4">Go Back</button>
      </div>
    );
  }

  const cryptoColors: Record<string, string> = { BTC: '#f59e0b', ETH: '#818cf8', USDT: '#10b981', SOL: '#e879f9' };

  return (
    <div className="animate-in">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
        <span className="material-icons text-lg">arrow_back</span>
        Back to Merchants
      </button>

      {/* Profile Header */}
      <div className="cz-card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {merchant.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{merchant.name}</h1>
                <Badge variant={getStatusVariant(merchant.status)} dot>
                  {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">{merchant.businessType} | ID: {merchant.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {merchant.status === 'pending' && (
              <button onClick={() => handleAction('approve')} disabled={actionLoading} className="cz-btn-success cz-btn-sm">
                <span className="material-icons text-sm">check</span> Approve
              </button>
            )}
            {merchant.status === 'active' && (
              <button onClick={() => handleAction('suspend')} disabled={actionLoading} className="cz-btn-danger cz-btn-sm">
                <span className="material-icons text-sm">block</span> Suspend
              </button>
            )}
            {merchant.status === 'suspended' && (
              <button onClick={() => handleAction('activate')} disabled={actionLoading} className="cz-btn-success cz-btn-sm">
                <span className="material-icons text-sm">play_arrow</span> Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm text-white mt-0.5">{merchant.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">WhatsApp</p>
            <p className="text-sm text-white mt-0.5">{merchant.whatsapp}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Volume</p>
            <p className="text-sm font-semibold text-white mt-0.5">${merchant.totalVolume.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Transactions</p>
            <p className="text-sm font-semibold text-white mt-0.5">{merchant.totalTransactions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Joined</p>
            <p className="text-sm text-white mt-0.5">{new Date(merchant.joinedAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cz-tabs mb-6 inline-flex">
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'wallets', label: 'Wallets', icon: 'account_balance_wallet' },
          { key: 'apikeys', label: 'API Keys', icon: 'vpn_key' },
          { key: 'activity', label: 'Activity Log', icon: 'history' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`cz-tab flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
          >
            <span className="material-icons text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallets Summary */}
          <div className="cz-card">
            <div className="cz-card-header no-border">
              <h3 className="cz-heading">Wallets</h3>
            </div>
            <div className="cz-card-body pt-0 space-y-2">
              {merchant.wallets.map((w) => (
                <div key={w.crypto} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: cryptoColors[w.crypto] || '#fff' }}>{w.crypto}</span>
                    <span className="text-xs text-slate-500 font-mono">{w.address}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{w.balance} {w.crypto}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="cz-card">
            <div className="cz-card-header no-border">
              <h3 className="cz-heading">Recent Activity</h3>
            </div>
            <div className="cz-card-body pt-0 space-y-1">
              {merchant.activityLog.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white">{log.action}</span>
                    <span className="text-sm text-slate-400 ml-2">{log.details}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{log.ip}</p>
                    <p className="text-xs text-slate-600">{new Date(log.timestamp).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="cz-card">
          <div className="cz-card-header">
            <h3 className="cz-heading">Wallet Addresses</h3>
          </div>
          <div className="cz-card-body space-y-3">
            {merchant.wallets.map((w) => (
              <div key={w.crypto} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cryptoColors[w.crypto] || '#666'}20` }}>
                    <span className="text-sm font-bold" style={{ color: cryptoColors[w.crypto] || '#fff' }}>{w.crypto}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{w.crypto} Wallet</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{w.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{w.balance}</p>
                  <p className="text-xs text-slate-500">{w.crypto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apikeys' && (
        <div className="cz-card">
          <div className="cz-card-header">
            <h3 className="cz-heading">API Keys</h3>
          </div>
          <div className="cz-card-body space-y-3">
            {merchant.apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <span className="material-icons text-slate-400">vpn_key</span>
                  <div>
                    <p className="text-sm font-medium text-white">{key.label}</p>
                    <p className="text-xs text-slate-500 font-mono">{key.prefix}...****</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Last used</p>
                    <p className="text-xs text-slate-400">{new Date(key.lastUsed).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Badge variant={key.active ? 'success' : 'danger'} size="sm">
                    {key.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="cz-card overflow-hidden">
          <table className="cz-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {merchant.activityLog.map((log) => (
                <tr key={log.id}>
                  <td><span className="font-medium text-white">{log.action}</span></td>
                  <td className="text-slate-400">{log.details}</td>
                  <td className="text-slate-500 font-mono text-xs">{log.ip}</td>
                  <td className="text-slate-400 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
