'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold">MC</span>
              </div>
              <span className="text-xl font-bold text-white">MyCryptoCoin</span>
            </Link>
          </div>
          <h4 className="text-center text-lg font-bold text-white mb-6">Forgot Password</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                <strong>Email or WhatsApp</strong>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all"
            >
              SUBMIT
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
