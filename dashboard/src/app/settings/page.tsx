'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('My Crypto Store');
  const [email, setEmail] = useState('merchant@example.com');
  const [whatsapp, setWhatsapp] = useState('+91 98765 43210');
  const [twoFA, setTwoFA] = useState(true);

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-xl font-bold text-white">Profile Settings</h2>

      {/* Profile Card */}
      <div className="glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            M
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{businessName}</h3>
            <p className="text-sm text-slate-400">{email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">WhatsApp Number</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Business Type</label>
            <select className="w-full bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50">
              <option>E-commerce</option>
              <option>Forex Broker</option>
              <option>Airline</option>
              <option>Real Estate</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all">
            Save Changes
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card">
        <h3 className="text-base font-bold text-white mb-4">Security</h3>
        <div className="flex items-center justify-between py-4 border-b border-[rgba(99,102,241,0.05)]">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Two-Factor Authentication</h4>
            <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security via WhatsApp OTP</p>
          </div>
          <button
            onClick={() => setTwoFA(!twoFA)}
            className={`relative w-12 h-6 rounded-full transition-all ${twoFA ? 'bg-indigo-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${twoFA ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between py-4 border-b border-[rgba(99,102,241,0.05)]">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Change Password</h4>
            <p className="text-xs text-slate-500 mt-0.5">Update your account password</p>
          </div>
          <button className="px-4 py-1.5 rounded-lg border border-[rgba(99,102,241,0.2)] text-indigo-400 text-xs font-medium hover:bg-indigo-500/5 transition-colors">
            Change
          </button>
        </div>
        <div className="flex items-center justify-between py-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Auto-Withdrawal</h4>
            <p className="text-xs text-slate-500 mt-0.5">Automatically withdraw when balance exceeds threshold</p>
          </div>
          <button className="px-4 py-1.5 rounded-lg border border-[rgba(99,102,241,0.2)] text-indigo-400 text-xs font-medium hover:bg-indigo-500/5 transition-colors">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
