'use client';

import React from 'react';
import type { SystemHealth as SystemHealthType } from '@/lib/api';

interface SystemHealthProps {
  health: SystemHealthType | null;
  loading?: boolean;
}

export default function SystemHealth({ health, loading }: SystemHealthProps) {
  if (loading || !health) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'bg-emerald-400';
      case 'degraded':
      case 'connecting':
        return 'bg-amber-400';
      case 'down':
      case 'disconnected':
        return 'bg-rose-400';
      default:
        return 'bg-white/30';
    }
  };

  const statusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const services = [
    {
      name: 'API Server',
      status: health.api.status,
      detail: `${health.api.latency}ms latency`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: 'Bitcoin Node',
      status: health.blockchain.btc.status,
      detail: `Block #${health.blockchain.btc.blockHeight.toLocaleString()}`,
      icon: <span className="text-xs font-bold text-amber-400">BTC</span>,
    },
    {
      name: 'Ethereum Node',
      status: health.blockchain.eth.status,
      detail: `Block #${health.blockchain.eth.blockHeight.toLocaleString()}`,
      icon: <span className="text-xs font-bold text-blue-400">ETH</span>,
    },
    {
      name: 'USDT (TRC20)',
      status: health.blockchain.usdt.status,
      detail: `Last sync: ${timeSince(health.blockchain.usdt.lastSync)}`,
      icon: <span className="text-xs font-bold text-emerald-400">USDT</span>,
    },
    {
      name: 'Solana Node',
      status: health.blockchain.sol.status,
      detail: `Block #${health.blockchain.sol.blockHeight.toLocaleString()}`,
      icon: <span className="text-xs font-bold text-purple-400">SOL</span>,
    },
    {
      name: 'WhatsApp',
      status: health.whatsapp.status,
      detail: statusLabel(health.whatsapp.status),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      ),
    },
    {
      name: 'Database',
      status: health.database.status,
      detail: `${health.database.connections} connections`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    },
    {
      name: 'Redis Cache',
      status: health.redis.status,
      detail: health.redis.memoryUsage,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            services.every((s) => s.status === 'healthy' || s.status === 'connected')
              ? 'bg-emerald-400'
              : services.some((s) => s.status === 'down' || s.status === 'disconnected')
              ? 'bg-rose-400'
              : 'bg-amber-400'
          } animate-pulse`} />
          <span className="text-xs text-white/40">
            {services.every((s) => s.status === 'healthy' || s.status === 'connected')
              ? 'All Systems Operational'
              : 'Issues Detected'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                {service.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{service.name}</p>
                <p className="text-xs text-white/30">{service.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor(service.status)}`} />
              <span className={`text-xs font-medium ${
                service.status === 'healthy' || service.status === 'connected'
                  ? 'text-emerald-400'
                  : service.status === 'degraded' || service.status === 'connecting'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {statusLabel(service.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
