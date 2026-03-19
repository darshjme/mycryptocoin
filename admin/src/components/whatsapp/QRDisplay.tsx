'use client';

import React, { useState, useEffect } from 'react';

interface QRDisplayProps {
  qrData: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
  onRefresh?: () => void;
}

export default function QRDisplay({ qrData, status, onRefresh }: QRDisplayProps) {
  const [countdown, setCountdown] = useState(30);
  const [isScanning, setIsScanning] = useState(false);

  // 30-second countdown for auto-refresh
  useEffect(() => {
    if (status !== 'qr_pending' && status !== 'disconnected') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefresh?.();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, onRefresh]);

  // Reset countdown when QR changes
  useEffect(() => {
    setCountdown(30);
  }, [qrData]);

  if (status === 'connected') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">WhatsApp Connected</h3>
        <p className="text-sm text-white/40">Your WhatsApp is paired and ready to send messages</p>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Connecting...</h3>
        <p className="text-sm text-white/40">Please wait while we establish a connection</p>
      </div>
    );
  }

  // QR Code generation using SVG (client-side QR rendering)
  const qrImageUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}&bgcolor=0f172a&color=ffffff&format=svg`
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* QR Code Container */}
      <div
        className={`relative p-6 rounded-2xl mb-6 ${isScanning ? 'qr-scanning' : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onMouseEnter={() => setIsScanning(true)}
        onMouseLeave={() => setIsScanning(false)}
      >
        {/* Animated border gradient */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500"
          style={{
            opacity: isScanning ? 1 : 0,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #3b82f6, #4f46e5)',
            backgroundSize: '300% 300%',
            animation: 'borderSpin 3s linear infinite',
            padding: '2px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
            borderRadius: '1rem',
          }}
        />

        {/* Corner markers */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />

        {qrImageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="WhatsApp QR Code"
              width={280}
              height={280}
              className="rounded-xl"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Logo overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-surface-900 border-2 border-white/10 flex items-center justify-center shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* Scan line animation */}
            {isScanning && (
              <div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent"
                style={{
                  animation: 'scanLine 2s ease-in-out infinite',
                  top: '50%',
                }}
              />
            )}
          </div>
        ) : (
          <div className="w-[280px] h-[280px] flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <p className="text-white/30 text-sm">Loading QR Code...</p>
            </div>
          </div>
        )}
      </div>

      {/* Countdown & Instructions */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 animate-spin-slow">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span className="text-xs text-white/40">
              Auto-refresh in <span className="text-white font-semibold">{countdown}s</span>
            </span>
          </div>
        </div>

        <div className="space-y-2 max-w-xs mx-auto">
          <h4 className="text-sm font-semibold text-white">How to pair:</h4>
          <div className="space-y-1.5">
            <Step number={1} text="Open WhatsApp on your phone" />
            <Step number={2} text='Tap Menu or Settings > Linked Devices' />
            <Step number={3} text='Tap "Link a Device"' />
            <Step number={4} text="Point your phone at this QR code" />
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          QR code expired? Click to refresh
        </button>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; opacity: 0; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-left">
      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <span className="text-xs text-white/50">{text}</span>
    </div>
  );
}
