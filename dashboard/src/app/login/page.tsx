'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, setLoading } = useAuthStore();
  const [whatsapp, setWhatsapp] = useState('+91 98765 43210');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ whatsapp?: string; password?: string }>({});
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!whatsapp) newErrors.whatsapp = 'WhatsApp number is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    // Demo login
    setTimeout(() => {
      login(
        {
          id: 'demo-1',
          email: 'merchant@example.com',
          whatsapp: whatsapp,
          businessName: 'My Crypto Store',
          businessType: 'ecommerce',
          is2FAEnabled: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        'demo-token-xyz',
        'demo-refresh-token-xyz'
      );
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background - matching CryptoZone bg-img-fix */}
      <div className="absolute inset-0 animated-bg" />
      <div className="absolute inset-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left panel - Form (matching col-xl-4 bg-white) */}
        <div className="w-full max-w-md lg:max-w-lg bg-[#0c0f1a]/95 backdrop-blur-xl border-r border-[rgba(99,102,241,0.1)] flex flex-col">
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-sm">
              {/* Logo */}
              <div className="mb-8">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <span className="text-xl font-bold text-white">MyCryptoCoin</span>
                </Link>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <h3 className="text-xl font-bold text-white">Sign In</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded" />
                <p className="text-sm text-slate-400">Enter your WhatsApp number and password.</p>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
                    placeholder="+91 98765 43210"
                  />
                  {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
                    placeholder="Enter your password"
                  />
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all"
                  >
                    Login
                  </button>
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500/40" />
                    Remember me
                  </label>
                </div>

                {/* Forgot password */}
                <div className="text-center">
                  <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full py-2.5 rounded-xl border border-indigo-500/30 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/5 transition-all"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>

          {/* Footer - matching card-footer */}
          <div className="px-8 py-4 border-t border-[rgba(99,102,241,0.08)] text-center">
            <span className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} MyCryptoCoin. All rights reserved.
            </span>
          </div>
        </div>

        {/* Right side - decorative (visible on lg+) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[rgba(99,102,241,0.2)] flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Secure Crypto Payments</h2>
            <p className="text-slate-400 text-sm">Accept cryptocurrency payments with the most secure payment gateway. Low fees, instant settlements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
