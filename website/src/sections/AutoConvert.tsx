'use client';

import { useEffect, useRef } from 'react';

const steps = [
  { icon: 'fa-solid fa-wallet', label: 'Customer Pays', detail: 'BTC, ETH, SOL, BNB...', color: '#F7931A' },
  { icon: 'fa-solid fa-arrows-rotate', label: 'Auto-Convert', detail: 'Live exchange rate', color: '#3B82F6' },
  { icon: 'fa-solid fa-dollar-sign', label: 'Settle in USDT', detail: 'TRC-20 stablecoin', color: '#26A17B' },
  { icon: 'fa-solid fa-building-columns', label: 'You Withdraw', detail: 'To your TRON wallet', color: '#8B5CF6' },
];

export default function AutoConvert() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 150);
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="auto-convert" className="py-20 md:py-28 relative overflow-hidden" ref={sectionRef}>
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <i className="fa-solid fa-shield-halved text-emerald-400 text-xs" />
            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Zero Volatility Risk</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Accept Any Crypto.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Get Paid in USDT.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every payment is automatically converted to USDT TRC-20 at the live exchange rate.
            Your balance is always stable. No crypto volatility. No surprises.
          </p>
        </div>

        {/* Flow visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 mb-16" data-aos="fade-up">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-4 z-20">
                  <i className="fa-solid fa-chevron-right text-white/20 text-lg" />
                </div>
              )}
              {/* Mobile connector */}
              {i < steps.length - 1 && (
                <div className="md:hidden absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                  <i className="fa-solid fa-chevron-down text-white/20 text-lg" />
                </div>
              )}

              <div className="glass-card rounded-2xl p-6 w-full group hover:scale-105 transition-transform duration-300">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                >
                  <i className={`${step.icon} text-xl`} style={{ color: step.color }} />
                </div>
                <div className="text-white font-bold mb-1">{step.label}</div>
                <div className="text-gray-400 text-sm">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Example conversion card */}
        <div className="max-w-2xl mx-auto" data-aos="fade-up">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 uppercase tracking-wider mb-2">Example Transaction</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Customer pays */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F7931A]/10 flex items-center justify-center">
                  <i className="fa-brands fa-bitcoin text-[#F7931A] text-xl" />
                </div>
                <div className="text-gray-500 text-xs mb-1">Customer pays</div>
                <div className="text-white font-bold text-lg">1.0 BTC</div>
                <div className="text-gray-500 text-xs">≈ $68,000</div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <i className="fa-solid fa-arrow-right text-emerald-400 text-2xl hidden md:block" />
                  <i className="fa-solid fa-arrow-down text-emerald-400 text-2xl md:hidden" />
                  <div className="text-[10px] text-gray-500 text-center">
                    <div>Conversion cost: <span className="text-amber-400">~$50</span></div>
                    <div>Platform fee (0.5%): <span className="text-blue-400">$339.75</span></div>
                  </div>
                </div>
              </div>

              {/* Merchant receives */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-sm">USDT</span>
                </div>
                <div className="text-gray-500 text-xs mb-1">You receive</div>
                <div className="text-emerald-400 font-bold text-lg">67,610.25 USDT</div>
                <div className="text-gray-500 text-xs">TRC-20 • Stable forever</div>
              </div>
            </div>

            {/* Benefits strip */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {[
                { icon: 'fa-solid fa-clock', text: 'Settles in minutes' },
                { icon: 'fa-solid fa-shield-halved', text: 'No price volatility' },
                { icon: 'fa-solid fa-money-bill-wave', text: '$1 withdrawal fee' },
                { icon: 'fa-solid fa-globe', text: 'Works worldwide' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <i className={`${b.icon} text-emerald-400/60`} />
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
