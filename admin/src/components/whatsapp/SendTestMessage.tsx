'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SendTestMessageProps {
  onSend: (phoneNumber: string, message: string) => Promise<boolean>;
  sending?: boolean;
  disabled?: boolean;
}

export default function SendTestMessage({ onSend, sending = false, disabled = false }: SendTestMessageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello from MyCryptoCoin Admin! This is a test message.');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    try {
      const result = await onSend(phoneNumber, message);
      if (result) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Failed to send message');
    }
  };

  return (
    <div className="cz-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Send Test Message</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Phone Number"
          placeholder="+91 98765 43210"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
            </svg>
          }
          disabled={disabled}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Enter your test message..."
            disabled={disabled}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 bg-white/5 border border-white/10 outline-none transition-all duration-200 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 focus:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed resize-none text-sm"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            <p className="text-sm text-emerald-400">Test message sent successfully!</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={sending}
          disabled={disabled}
          fullWidth
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          }
        >
          {sending ? 'Sending...' : 'Send Test Message'}
        </Button>

        {disabled && (
          <p className="text-xs text-white/30 text-center">
            WhatsApp must be connected to send messages
          </p>
        )}
      </form>
    </div>
  );
}
