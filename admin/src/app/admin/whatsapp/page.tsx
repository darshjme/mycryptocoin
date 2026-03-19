'use client';

import React from 'react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import QRDisplay from '@/components/whatsapp/QRDisplay';
import ConnectionStatus from '@/components/whatsapp/ConnectionStatus';
import MessageLog from '@/components/whatsapp/MessageLog';
import SendTestMessage from '@/components/whatsapp/SendTestMessage';

export default function WhatsAppPage() {
  const {
    status,
    qrCode,
    messages,
    loading,
    sendingTest,
    error,
    fetchQR,
    sendTestMessage,
    reconnect,
    disconnect,
    setError,
  } = useWhatsApp();

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Pair your WhatsApp to send OTPs and notifications to merchants
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status.connected ? (
            <button onClick={disconnect} className="cz-btn-danger cz-btn-sm">
              <span className="material-icons text-sm">link_off</span>
              Disconnect
            </button>
          ) : (
            <button
              onClick={reconnect}
              disabled={status.status === 'connecting'}
              className="cz-btn-primary cz-btn-sm"
            >
              {status.status === 'connecting' ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-icons text-sm">refresh</span>
              )}
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="material-icons text-rose-400">error</span>
            <span className="text-sm text-rose-300">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
            <span className="material-icons text-lg">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - QR Code & Connection */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* QR Code Display */}
          <div className="cz-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="cz-heading">
                {status.connected ? 'Device Paired' : 'Scan QR Code'}
              </h3>
              {!status.connected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-amber-400" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Waiting for scan
                </span>
              )}
            </div>
            <QRDisplay
              qrData={qrCode}
              status={status.status}
              onRefresh={fetchQR}
            />
          </div>

          {/* Connection Status */}
          <ConnectionStatus
            status={status.status}
            pairedNumber={status.pairedNumber}
            messagesSentToday={status.messagesSentToday}
            lastSeen={status.lastSeen}
          />
        </div>

        {/* Right Column - Messages & Actions */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <div className="cz-card p-4 text-center">
              <span className="material-icons text-2xl text-emerald-400 mb-2">sms</span>
              <p className="text-lg font-bold text-white">{status.messagesSentToday}</p>
              <p className="text-xs text-slate-400">Messages Today</p>
            </div>
            <div className="cz-card p-4 text-center">
              <span className="material-icons text-2xl text-blue-400 mb-2">security</span>
              <p className="text-lg font-bold text-white">
                {messages.filter((m) => m.type === 'otp').length}
              </p>
              <p className="text-xs text-slate-400">OTPs Sent</p>
            </div>
            <div className="cz-card p-4 text-center">
              <span className="material-icons text-2xl mb-2" style={{ color: status.connected ? '#10b981' : '#f43f5e' }}>
                {status.connected ? 'wifi' : 'wifi_off'}
              </span>
              <p className="text-sm font-bold text-white">
                {status.connected ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-slate-400">Connection</p>
            </div>
          </div>

          {/* Send Test Message */}
          <SendTestMessage
            onSend={sendTestMessage}
            sending={sendingTest}
            disabled={!status.connected && status.status !== 'qr_pending'}
          />

          {/* Message Log */}
          <MessageLog messages={messages} loading={loading} />
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 cz-card p-5">
        <h3 className="cz-heading mb-3">About WhatsApp Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="material-icons text-indigo-400 text-xl mb-2">lock</span>
            <h4 className="text-sm font-semibold text-white mb-1">2FA OTP Delivery</h4>
            <p className="text-xs text-slate-400">
              Sends one-time passwords to admin phones for secure login verification via WhatsApp.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="material-icons text-emerald-400 text-xl mb-2">notifications_active</span>
            <h4 className="text-sm font-semibold text-white mb-1">Merchant Notifications</h4>
            <p className="text-xs text-slate-400">
              Notifies merchants about payment confirmations, withdrawals, and account updates.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="material-icons text-amber-400 text-xl mb-2">warning</span>
            <h4 className="text-sm font-semibold text-white mb-1">Security Alerts</h4>
            <p className="text-xs text-slate-400">
              Instant alerts for suspicious activity, failed transactions, and system health issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
