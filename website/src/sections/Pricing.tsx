'use client';

import { useEffect, useRef } from 'react';

const competitors = [
  { name: 'MyCryptoCoin', fee: '0.5%', setup: 'Free', monthly: 'Free', settlement: 'Instant', highlight: true },
  { name: 'BitPay', fee: '1%', setup: '$300', monthly: '$0', settlement: '1-2 days', highlight: false },
  { name: 'Coinbase Commerce', fee: '1%', setup: 'Free', monthly: '$0', settlement: '2-3 days', highlight: false },
  { name: 'CoinGate', fee: '1%', setup: 'Free', monthly: '$0', settlement: '1 day', highlight: false },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 100);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">Pricing</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
        </div>

        {/* Main pricing card */}
        <div className="max-w-3xl mx-auto mb-20" data-aos="fade-up">
          <div className="glass-card rounded-3xl p-10 md:p-14 text-center relative overflow-hidden gradient-border">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="text-7xl md:text-8xl font-extrabold text-white mb-2">
              0.5<span className="text-gradient">%</span>
            </div>
            <p className="text-xl text-gray-300 mb-2">per transaction</p>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              No monthly fees. No setup fees. No hidden charges. Just pay for what you process.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {[
                'No monthly fees',
                'No setup costs',
                'No minimum volume',
                'Instant settlement',
                'All cryptos included',
                'Free API access',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
            <a
              href="https://dashboard.mycrypto.co.in/register"
              className="inline-flex px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
            >
              Start Free — No Credit Card Required
            </a>
          </div>
        </div>

        {/* Comparison table */}
        <div data-aos="fade-up">
          <h3 className="text-2xl font-bold text-white text-center mb-8">How We Compare</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-sm font-medium text-gray-400 pb-4 pr-4">Provider</th>
                  <th className="text-center text-sm font-medium text-gray-400 pb-4 px-4">Fee</th>
                  <th className="text-center text-sm font-medium text-gray-400 pb-4 px-4">Setup</th>
                  <th className="text-center text-sm font-medium text-gray-400 pb-4 px-4">Monthly</th>
                  <th className="text-center text-sm font-medium text-gray-400 pb-4 pl-4">Settlement</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={i}
                    className={`border-b border-white/5 ${
                      c.highlight ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <td className="py-4 pr-4">
                      <span className={`font-semibold ${c.highlight ? 'text-blue-400' : 'text-gray-300'}`}>
                        {c.name}
                      </span>
                      {c.highlight && (
                        <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                          BEST
                        </span>
                      )}
                    </td>
                    <td className={`text-center py-4 px-4 font-semibold ${c.highlight ? 'text-white' : 'text-gray-400'}`}>
                      {c.fee}
                    </td>
                    <td className={`text-center py-4 px-4 ${c.highlight ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {c.setup}
                    </td>
                    <td className={`text-center py-4 px-4 ${c.highlight ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {c.monthly}
                    </td>
                    <td className={`text-center py-4 pl-4 ${c.highlight ? 'text-white' : 'text-gray-400'}`}>
                      {c.settlement}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
