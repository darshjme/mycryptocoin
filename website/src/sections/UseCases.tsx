'use client';

import { useState, useEffect, useRef } from 'react';

const useCases = [
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    title: 'E-Commerce Stores',
    description: 'Accept crypto payments in your online store with our WooCommerce plugin or custom API integration. Support Shopify, Magento, and custom platforms.',
    features: ['One-click WooCommerce plugin', 'Shopping cart integration', 'Auto price conversion', 'Order status webhooks'],
  },
  {
    id: 'airlines',
    label: 'Airlines',
    title: 'Airlines & Travel',
    description: 'Let travellers book flights and hotels with cryptocurrency. Handle high-value transactions securely with instant confirmations.',
    features: ['High-value transaction support', 'Multi-currency checkout', 'Refund automation', 'Booking confirmation webhooks'],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    title: 'Real Estate',
    description: 'Accept property deposits and rental payments in crypto. Smart escrow support for high-value property transactions.',
    features: ['Escrow payment support', 'Large transaction handling', 'Compliance documentation', 'Multi-signature wallets'],
  },
  {
    id: 'forex',
    label: 'Forex Brokers',
    title: 'Forex Brokers',
    description: 'Enable crypto deposits and withdrawals for your trading platform. Instant funding with real-time balance updates.',
    features: ['Instant deposit credits', 'Auto-withdrawal system', 'Real-time rate feeds', 'Margin account funding'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    title: 'Gaming & Digital',
    description: 'Microtransactions, in-game purchases, and digital goods powered by crypto. Low fees perfect for small transactions.',
    features: ['Micro-payment support', 'In-game currency integration', 'Digital license delivery', 'Subscription billing'],
  },
];

export default function UseCases() {
  const [active, setActive] = useState('ecommerce');
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

  const activeCase = useCases.find((uc) => uc.id === active)!;

  return (
    <section id="use-cases" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12" data-aos="fade-up">
          <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">Use Cases</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Built for <span className="text-gradient">Every Industry</span>
          </h2>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-12" data-aos="fade-up">
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActive(uc.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === uc.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              {uc.label}
            </button>
          ))}
        </div>

        {/* Active use case detail */}
        <div className="glass-card rounded-2xl p-8 md:p-12" data-aos="fade-up">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{activeCase.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{activeCase.description}</p>
              <ul className="space-y-3">
                {activeCase.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 mt-8 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors group"
              >
                Learn More
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-5xl font-extrabold text-gradient">
                    {activeCase.label.charAt(0)}
                  </div>
                  <p className="text-white font-semibold">{activeCase.label}</p>
                  <p className="text-gray-500 text-sm mt-1">Powered by MyCryptoCoin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
