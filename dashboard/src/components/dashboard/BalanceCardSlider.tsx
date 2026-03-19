'use client';

import React from 'react';

interface BalanceCard {
  title: string;
  amount: string;
  subtitle: string;
  subtitleValue: string;
  subtitleColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const cards: BalanceCard[] = [
  {
    title: 'Total Balance',
    amount: '$45,892.30',
    subtitle: 'BTC',
    subtitleValue: '1.28574 BTC',
    subtitleColor: 'text-amber-400',
    gradientFrom: 'from-indigo-500/10',
    gradientTo: 'to-purple-500/10',
  },
  {
    title: 'Monthly Revenue',
    amount: '$12,847.65',
    subtitle: 'Growth',
    subtitleValue: '+12.5%',
    subtitleColor: 'text-emerald-400',
    gradientFrom: 'from-emerald-500/10',
    gradientTo: 'to-teal-500/10',
  },
  {
    title: 'Pending Payments',
    amount: '$3,241.00',
    subtitle: 'Count',
    subtitleValue: '23 pending',
    subtitleColor: 'text-amber-400',
    gradientFrom: 'from-amber-500/10',
    gradientTo: 'to-orange-500/10',
  },
  {
    title: 'Total Withdrawals',
    amount: '$28,450.00',
    subtitle: 'This Month',
    subtitleValue: '+$4,200',
    subtitleColor: 'text-indigo-400',
    gradientFrom: 'from-blue-500/10',
    gradientTo: 'to-indigo-500/10',
  },
];

export default function BalanceCardSlider() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`
            relative overflow-hidden rounded-2xl p-5
            bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo}
            border border-[rgba(99,102,241,0.1)]
            transition-all duration-300 hover:-translate-y-0.5
            hover:border-[rgba(99,102,241,0.2)]
          `}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
            <svg viewBox="0 0 64 127" fill="none">
              <path
                d="M70.2 32c-6.8-3.8-14.1-6.6-21.3-9.6-4.2-1.7-8.2-3.7-11.7-6.5C30.3 10.3 31.6 1.4 39.8-2.2c2.3-1 4.7-1.3 7.1-1.5 9.4-.5 18.4 1.2 26.9 5.3 4.2 2 5.6 1.4 7-3 1.5-4.7 2.8-9.4 4.2-14.2 1-3.2-.2-5.3-3.1-6.6-5.6-2.4-11.2-4.1-17.1-5.1-7.7-1.2-7.7-1.2-7.7-8.9 0-10.9 0-10.9-10.9-10.9h-4.7c-5.1.1-6 1-6.1 6.1v6.9c-.1 6.8-.1 6.7-6.6 9.1C12.9-19 3.1-8.2 2.1 9c-1 15.3 7 25.6 19.5 33.1 7.7 4.6 16.3 7.4 24.5 11 3.2 1.4 6.2 3 8.9 5.3 7.9 6.5 6.5 17.3-2.9 21.4-5 2.2-10.3 2.7-15.7 2-8.4-1-16.4-3.2-24-7.1-4.4-2.3-5.7-1.7-7.2 3.1-1.3 4.1-2.4 8.3-3.6 12.5-1.5 5.6-1 6.9 4.4 9.6 6.8 3.3 14.1 5 21.5 6.2 5.8.9 6 1.2 6.1 7.2 0 2.7 0 5.5 0 8.2.1 3.5 1.7 5.5 5.3 5.6h12.1c3.3-.1 5-1.9 5-5.2V110.5c-.2-3.8 1.4-5.8 5.1-6.8 8.4-2.3 15.6-6.8 21.2-13.6C97.8 71.4 92 44.1 70.2 32z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <h4 className="text-xl font-bold text-slate-100">{card.amount}</h4>
            <p className="text-sm text-slate-400 mt-1">{card.title}</p>
            <div className="mt-3">
              <span className={`text-sm font-medium ${card.subtitleColor}`}>
                {card.subtitleValue}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
