'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function QuickWithdrawForm() {
  const [activeTab, setActiveTab] = useState<'withdraw' | 'convert'>('withdraw');
  const [activeSubTab, setActiveSubTab] = useState<'instant' | 'scheduled'>('instant');

  return (
    <div className="glass-card p-0 overflow-hidden">
      {/* Buy/Sell Tabs - matching CryptoZone buy-sell pattern */}
      <div className="flex border-b border-[rgba(99,102,241,0.1)]">
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-all ${
            activeTab === 'withdraw'
              ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('convert')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-all ${
            activeTab === 'convert'
              ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Convert
        </button>
      </div>

      {/* Sub tabs - matching limit-sell */}
      <div className="flex border-b border-[rgba(99,102,241,0.05)]">
        <button
          onClick={() => setActiveSubTab('instant')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-all ${
            activeSubTab === 'instant' ? 'text-indigo-400' : 'text-slate-600'
          }`}
        >
          Instant {activeTab === 'withdraw' ? 'Withdraw' : 'Convert'}
        </button>
        <button
          onClick={() => setActiveSubTab('scheduled')}
          className={`flex-1 py-2 text-xs font-medium text-center transition-all ${
            activeSubTab === 'scheduled' ? 'text-indigo-400' : 'text-slate-600'
          }`}
        >
          Scheduled
        </button>
      </div>

      {/* Form - matching sell-element / OrderForm */}
      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-indigo-400">
              {activeTab === 'withdraw' ? 'Amount' : 'From'}
            </label>
            <span className="text-xs text-slate-500">
              Balance: <span className="text-slate-300">$45,892.30</span>
            </span>
          </div>
          <div className="flex bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl overflow-hidden">
            <input
              type="number"
              placeholder="0.00"
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <span className="flex items-center px-3 bg-[rgba(99,102,241,0.05)] text-xs font-semibold text-slate-400 border-l border-[rgba(99,102,241,0.1)]">
              USDT
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-indigo-400 mb-1.5 block">
            {activeTab === 'withdraw' ? 'Wallet Address' : 'To'}
          </label>
          <div className="flex bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl overflow-hidden">
            <input
              type="text"
              placeholder={activeTab === 'withdraw' ? 'Enter wallet address' : 'Amount'}
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <span className="flex items-center px-3 bg-[rgba(99,102,241,0.05)] text-xs font-semibold text-slate-400 border-l border-[rgba(99,102,241,0.1)]">
              {activeTab === 'withdraw' ? 'TRC20' : 'BTC'}
            </span>
          </div>
        </div>

        {activeTab === 'withdraw' && (
          <div>
            <label className="text-sm font-medium text-indigo-400 mb-1.5 block">Network Fee</label>
            <div className="flex bg-[#1a1d2e]/80 border border-[rgba(99,102,241,0.15)] rounded-xl overflow-hidden">
              <input
                type="text"
                value="1.50"
                readOnly
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-400 focus:outline-none"
              />
              <span className="flex items-center px-3 bg-[rgba(99,102,241,0.05)] text-xs font-semibold text-slate-400 border-l border-[rgba(99,102,241,0.1)]">
                USDT
              </span>
            </div>
          </div>
        )}

        {/* Slider - matching ReactSlider */}
        <div className="pt-2">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="25"
            className="w-full h-1.5 bg-[#1a1d2e] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/withdrawals"
            className="inline-flex items-center justify-center w-3/4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-purple-400 transition-all"
          >
            {activeTab === 'withdraw' ? 'WITHDRAW' : 'CONVERT'}
          </Link>
        </div>
      </div>
    </div>
  );
}
