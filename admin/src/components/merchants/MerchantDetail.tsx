'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import type { Merchant } from '@/lib/api';

interface MerchantDetailData extends Merchant {
  wallets: Array<{ crypto: string; address: string; balance: number }>;
  apiKeys: Array<{ id: string; label: string; prefix: string; createdAt: string; lastUsed: string; active: boolean }>;
  activityLog: Array<{ id: string; action: string; details: string; ip: string; timestamp: string }>;
}

interface MerchantDetailProps {
  merchant: MerchantDetailData;
}

const cryptoIcons: Record<string, string> = {
  BTC: 'text-amber-400',
  ETH: 'text-blue-400',
  USDT: 'text-emerald-400',
  SOL: 'text-purple-400',
};

export default function MerchantDetail({ merchant }: MerchantDetailProps) {
  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {merchant.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">{merchant.name}</h2>
              <Badge variant={getStatusVariant(merchant.status)} dot>
                {merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <InfoItem label="Email" value={merchant.email} />
              <InfoItem label="WhatsApp" value={merchant.whatsapp} />
              <InfoItem label="Business Type" value={merchant.businessType} />
              <InfoItem
                label="Joined"
                value={new Date(merchant.joinedAt).toLocaleDateString('en', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">${merchant.totalVolume.toLocaleString()}</p>
            <p className="text-sm text-white/40">Total Volume</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{merchant.totalTransactions.toLocaleString()}</p>
            <p className="text-sm text-white/40">Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{merchant.apiKeyCount}</p>
            <p className="text-sm text-white/40">API Keys</p>
          </div>
        </div>
      </Card>

      {/* Wallets */}
      <Card>
        <CardHeader title="Wallets" subtitle={`${merchant.wallets.length} wallets`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {merchant.wallets.map((wallet) => (
            <div
              key={wallet.crypto}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${cryptoIcons[wallet.crypto] || 'text-white/60'}`}>
                  {wallet.crypto}
                </span>
                <div>
                  <p className="text-sm text-white/50 font-mono">{wallet.address}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-white">
                {wallet.balance} {wallet.crypto}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader title="API Keys" subtitle={`${merchant.apiKeys.length} keys`} />
        <div className="space-y-2">
          {merchant.apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{key.label}</p>
                  <p className="text-xs text-white/30 font-mono">{key.prefix}...****</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-white/40">Last used</p>
                  <p className="text-xs text-white/60">
                    {new Date(key.lastUsed).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge variant={key.active ? 'success' : 'danger'} size="sm">
                  {key.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader title="Activity Log" subtitle="Recent activity" />
        <div className="space-y-1">
          {merchant.activityLog.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{log.action}</span>
                  <span className="text-sm text-white/40">{log.details}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-white/30">{log.ip}</p>
                <p className="text-xs text-white/20">
                  {new Date(log.timestamp).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/30 mb-0.5">{label}</p>
      <p className="text-sm text-white/70 truncate">{value}</p>
    </div>
  );
}
