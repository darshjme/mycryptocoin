'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    whatsapp: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp number is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    router.push('/login');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 animated-bg" />
      <div className="absolute inset-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <div className="w-full max-w-md lg:max-w-lg bg-[#0c0f1a]/95 backdrop-blur-xl border-r border-[rgba(99,102,241,0.1)] flex flex-col">
          <div className="flex-1 flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-sm">
              <div className="mb-6">
                <Link href="/login" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <span className="text-xl font-bold text-white">MyCryptoCoin</span>
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white">Sign Up</h3>
                <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded" />
                <p className="text-sm text-slate-400">Enter your business details below:</p>

                <div>
                  <input
                    type="text"
                    placeholder="Business Name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {errors.businessName && <p className="text-xs text-red-400 mt-1">{errors.businessName}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Owner Full Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (+91...)"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="business@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="flex items-start gap-2 text-xs text-slate-400">
                    <input type="checkbox" className="mt-0.5 rounded border-slate-600 bg-transparent text-indigo-500 focus:ring-indigo-500/40" />
                    <span>I agree to the <Link href="#" className="text-indigo-400">Terms of Service</Link> &amp; <Link href="#" className="text-indigo-400">Privacy Policy</Link></span>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <Link href="/login" className="px-5 py-2.5 rounded-xl border border-[rgba(99,102,241,0.2)] text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all">
                    Back
                  </Link>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="px-8 py-4 border-t border-[rgba(99,102,241,0.08)] text-center">
            <span className="text-xs text-slate-600">&copy; {new Date().getFullYear()} MyCryptoCoin. All rights reserved.</span>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start Accepting Crypto</h2>
            <p className="text-slate-400 text-sm">Join thousands of merchants using MyCryptoCoin to accept cryptocurrency payments globally.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
