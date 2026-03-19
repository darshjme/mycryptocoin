'use client';

import { useState, FormEvent } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function LoginPage() {
  const { login, verifyOtp, loading, error, otpRequired, setError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch {
      // error handled in hook
    }
  };

  const handleOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyOtp(otp);
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-body)' }}>
      {/* Background decorations like CryptoZone */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
            <span className="material-icons text-3xl text-white">currency_bitcoin</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MyCryptoCoin</h1>
          <p className="text-slate-400 text-sm mt-1">Administration Panel</p>
        </div>

        {/* Login Card - CryptoZone style */}
        <div className="cz-card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {otpRequired ? 'WhatsApp Verification' : 'Sign In'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {otpRequired
                ? 'Enter the OTP sent to your WhatsApp'
                : 'Sign in to your admin account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
              {error}
            </div>
          )}

          {!otpRequired ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cz-input"
                  placeholder="admin@mycryptocoin.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cz-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 accent-indigo-500" />
                  <span className="text-sm text-slate-400">Remember me</span>
                </label>
                <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="cz-btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl mb-2" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <span className="material-icons text-emerald-400">verified</span>
                <div>
                  <p className="text-sm text-emerald-300 font-medium">OTP Sent</p>
                  <p className="text-xs text-slate-400">Check your WhatsApp for the 6-digit code</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="cz-input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="------"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="cz-btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cz-btn-outline w-full"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          MyCryptoCoin Admin v1.0 &middot; Secure access only
        </p>
      </div>
    </div>
  );
}
