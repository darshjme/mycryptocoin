'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mobileNavItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Wallets',
    href: '/wallets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'More',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

const moreMenuItems = [
  { label: 'Transactions', href: '/transactions' },
  { label: 'Withdrawals', href: '/withdrawals' },
  { label: 'Reports', href: '/reports' },
  { label: 'Activity', href: '/activity' },
  { label: 'Settings', href: '/settings' },
  { label: 'Integration', href: '/integration' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-[#1a1d2e] border-t border-[rgba(99,102,241,0.15)] rounded-t-2xl p-4 scale-in">
            <div className="space-y-1">
              {moreMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`
                    block px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${
                      pathname === item.href
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0b0d14]/95 backdrop-blur-xl border-t border-[rgba(99,102,241,0.08)]">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            const isActive = item.href !== '#' && (pathname === item.href || pathname?.startsWith(item.href + '/'));
            const isMore = item.href === '#';

            return isMore ? (
              <button
                key="more"
                onClick={() => setShowMore(!showMore)}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  showMore ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
