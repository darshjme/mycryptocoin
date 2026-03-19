'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface CryptoOption {
  key: string;
  name: string;
  network: string;
  token: string;
  isToken: boolean;
}

interface CheckoutData {
  sessionId: string;
  amount: string;
  originalAmount?: string;
  currency: string;
  displayMode: string;
  expiresAt: string;
  status: string;
  discount?: { code: string; discountAmount: string; finalAmount: string } | null;
  merchant: { name: string; logo: string | null };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    removeBranding: boolean;
    customCss?: string;
  };
  availableCryptos: CryptoOption[];
  payment: {
    id: string;
    status: string;
    depositAddress: string;
    cryptoAmount: string;
    network: string;
    token: string;
    receivedAmount: string;
    expiresAt: string;
  } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://mycrypto.co.in/api/v1';

// Token color mapping
const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', USDC: '#2775CA',
  BNB: '#F3BA2F', SOL: '#9945FF', MATIC: '#8247E5', TRX: '#FF0013',
  LTC: '#BFBBBB', DOGE: '#C2A633', XRP: '#23292F', AVAX: '#E84142',
  DOT: '#E6007A', ADA: '#0033AD', XMR: '#FF6600', ZEC: '#ECB244',
  BCH: '#0AC18E', LINK: '#2A5ADA', UNI: '#FF007A', AAVE: '#B6509E',
  DAI: '#F5AC37', SHIB: '#FFA409', PEPE: '#3E8A2D', ARB: '#213147',
  OP: '#FF0420',
};

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isEmbed = searchParams.get('embed') === '1';

  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch checkout session data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`${API_BASE}/checkout/${sessionId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.data.payment) {
            setSelectedCrypto(`${json.data.payment.network}:${json.data.payment.token}`);
            setPaymentStatus(json.data.payment.status);
          }
        } else {
          setError(json.error?.message || 'Session not found');
        }
      } catch {
        setError('Failed to load checkout session');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(data.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [data]);

  // Poll payment status
  useEffect(() => {
    if (!data || paymentStatus === 'PAID' || paymentStatus === 'EXPIRED') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/checkout/${sessionId}/status`);
        const json = await res.json();
        if (json.success && json.data.payment) {
          setPaymentStatus(json.data.payment.status);
          if (json.data.payment.status === 'PAID' || json.data.payment.status === 'OVERPAID') {
            // Notify parent if embedded
            if (isEmbed && window.parent !== window) {
              window.parent.postMessage({
                type: 'mcc:payment:success',
                payload: { sessionId, paymentId: json.data.paymentId, status: json.data.payment.status },
              }, '*');
            }
          }
        }
      } catch { /* silent retry */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [data, paymentStatus, sessionId, isEmbed]);

  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#111118] rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Checkout Unavailable</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const theme = data.theme;

  // Success screen
  if (paymentStatus === 'PAID' || paymentStatus === 'OVERPAID') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#111118] rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: `${theme.accentColor}20` }}>
            <svg className="w-10 h-10" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-400 mb-4">Your payment of {data.amount} {data.currency} has been confirmed.</p>
          <p className="text-gray-500 text-sm">Merchant: {data.merchant.name}</p>
          {!theme.removeBranding && (
            <p className="text-gray-600 text-xs mt-8">Powered by MyCryptoCoin</p>
          )}
        </div>
      </div>
    );
  }

  // Expired screen
  if (paymentStatus === 'EXPIRED' || timeRemaining === 'Expired') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-[#111118] rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Expired</h2>
          <p className="text-gray-400">This checkout session has expired. Please request a new payment link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {theme.customCss && <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />}

      <div className="bg-[#111118] rounded-2xl max-w-md w-full border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
          {(theme.logoUrl || data.merchant.logo) && (
            <img
              src={theme.logoUrl || data.merchant.logo || ''}
              alt={data.merchant.name}
              className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 object-contain"
            />
          )}
          <h1 className="text-xl font-bold text-white">{data.merchant.name}</h1>
          <div className="mt-3">
            <span className="text-3xl font-bold text-white">{data.amount}</span>
            <span className="text-white/80 ml-2 text-lg">{data.currency}</span>
          </div>
          {data.discount && (
            <div className="mt-2 inline-block bg-white/10 text-white/90 text-sm px-3 py-1 rounded-full">
              Discount: -{data.discount.discountAmount} {data.currency} ({data.discount.code})
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="px-6 py-3 bg-[#0d0d12] flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-400">Expires in</span>
          <span className="font-mono font-bold text-white">{timeRemaining}</span>
        </div>

        <div className="p-6">
          {/* Crypto selector */}
          {!data.payment && (
            <>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Select cryptocurrency</h3>
              <div className="grid grid-cols-3 gap-2 mb-6 max-h-48 overflow-y-auto">
                {data.availableCryptos.map((crypto) => (
                  <button
                    key={crypto.key}
                    onClick={() => setSelectedCrypto(crypto.key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      selectedCrypto === crypto.key
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/5 hover:border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: TOKEN_COLORS[crypto.token] || '#666' }}
                    >
                      {crypto.token.slice(0, 3)}
                    </div>
                    <span className="text-xs text-white font-medium">{crypto.token}</span>
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">{crypto.network}</span>
                  </button>
                ))}
              </div>

              {selectedCrypto && (
                <button
                  className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                >
                  Pay with {selectedCrypto.split(':')[1]}
                </button>
              )}
            </>
          )}

          {/* Payment details (after crypto selected & payment created) */}
          {data.payment && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Send exactly</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {data.payment.cryptoAmount} {data.payment.token}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.payment.network}</p>
              </div>

              {/* QR Code placeholder */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center">
                  <div className="text-center text-gray-600 text-xs">
                    <svg className="w-24 h-24 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm0 4h-2v2h2v-2zm-4-4h-2v2h2v-2zm0 4h-2v2h2v-2zm4 0h-2v2h2v-2zm0-4h-2v2h2v-2z" />
                    </svg>
                    QR Code
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Payment address</p>
                <div
                  className="bg-[#0d0d12] rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-[#0f0f16] transition-colors"
                  onClick={() => copyAddress(data.payment!.depositAddress)}
                >
                  <code className="text-sm text-white break-all flex-1 font-mono">
                    {data.payment.depositAddress}
                  </code>
                  <button className="shrink-0 text-gray-400 hover:text-white">
                    {copied ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Waiting for payment...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!theme.removeBranding && (
          <div className="px-6 py-3 border-t border-white/5 text-center">
            <a
              href="https://mycrypto.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Powered by MyCryptoCoin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
