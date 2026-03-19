'use client';

import React from 'react';
import Badge, { getStatusVariant } from '@/components/ui/Badge';

interface Message {
  id: string;
  to: string;
  type: 'otp' | 'notification' | 'test' | 'alert';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

interface MessageLogProps {
  messages: Message[];
  loading?: boolean;
}

const typeConfig: Record<string, { color: string; label: string }> = {
  otp: { color: 'text-blue-400', label: 'OTP' },
  notification: { color: 'text-purple-400', label: 'Notification' },
  test: { color: 'text-amber-400', label: 'Test' },
  alert: { color: 'text-rose-400', label: 'Alert' },
};

export default function MessageLog({ messages, loading }: MessageLogProps) {
  if (loading) {
    return (
      <div className="cz-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Messages</h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cz-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Messages</h3>
        <span className="text-xs text-white/30">{messages.length} messages</span>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-white/30 text-sm">No messages sent yet</div>
        ) : (
          messages.map((msg) => {
            const config = typeConfig[msg.type] || typeConfig.notification;
            return (
              <div
                key={msg.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    <Badge variant={getStatusVariant(msg.status)} size="sm">
                      {msg.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-white/20">
                    {new Date(msg.timestamp).toLocaleTimeString('en', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-white/60 mb-1 line-clamp-2">{msg.content}</p>
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                  </svg>
                  <span className="text-xs text-white/30">{msg.to}</span>
                </div>

                {/* Delivery status icons */}
                <div className="flex items-center gap-1 mt-1.5">
                  {msg.status === 'sent' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {msg.status === 'delivered' && (
                    <div className="flex -space-x-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                  )}
                  {msg.status === 'read' && (
                    <div className="flex -space-x-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                  )}
                  {msg.status === 'failed' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                  <span className="text-[10px] text-white/20 ml-1">
                    {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : msg.status === 'sent' ? 'Sent' : 'Failed'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
