'use client';

import React from 'react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  pairedNumber?: string;
  messagesSentToday?: number;
  lastSeen?: string;
}

export default function ConnectionStatus({
  status,
  pairedNumber,
  messagesSentToday = 0,
  lastSeen,
}: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      color: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]',
      text: 'Connected',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
    },
    disconnected: {
      color: 'bg-rose-400',
      glow: 'shadow-[0_0_12px_rgba(251,113,133,0.5)]',
      text: 'Disconnected',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
      borderColor: 'border-rose-400/20',
    },
    connecting: {
      color: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      text: 'Connecting',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
    },
    qr_pending: {
      color: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      text: 'Awaiting QR Scan',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="cz-card p-6">
      <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Connection Status</h3>

      {/* Status Indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`relative w-14 h-14 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
          <div className={`w-4 h-4 rounded-full ${config.color} ${config.glow}`} />
          {status === 'connecting' && (
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/30 animate-ping" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${config.textColor}`}>{config.text}</span>
          </div>
          {pairedNumber && (
            <p className="text-sm text-white/50 mt-0.5">
              Paired: <span className="text-white/70 font-medium">{pairedNumber}</span>
            </p>
          )}
          {!pairedNumber && status !== 'connected' && (
            <p className="text-sm text-white/30 mt-0.5">No device paired</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/30 mb-1">Messages Today</p>
          <p className="text-xl font-bold text-white">{messagesSentToday}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/30 mb-1">Last Active</p>
          <p className="text-sm font-medium text-white/70">
            {lastSeen
              ? new Date(lastSeen).toLocaleTimeString('en', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
          <span className="text-xs text-white/40">
            {status === 'connected'
              ? 'Ready to send OTPs and notifications'
              : status === 'qr_pending'
              ? 'Scan the QR code to pair WhatsApp'
              : status === 'connecting'
              ? 'Establishing connection to WhatsApp servers...'
              : 'WhatsApp session has ended. Reconnect to resume.'}
          </span>
        </div>
      </div>
    </div>
  );
}
