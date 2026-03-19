'use client';

import { useEffect, useRef } from 'react';

const features = [
  {
    iconClass: 'fa-solid fa-arrows-rotate',
    title: 'Auto-Convert to USDT',
    description:
      'Every payment is instantly converted to USDT TRC-20. Accept BTC, ETH, SOL — your balance is always in stable USDT. Zero volatility risk.',
  },
  {
    iconClass: 'fa-solid fa-bolt-lightning',
    title: 'Lightning Network',
    description:
      'Near-instant Bitcoin payments via Lightning Network. Sub-3-second settlement, near-zero fees. BOLT11 invoice support for the fastest BTC experience.',
  },
  {
    iconClass: 'fa-solid fa-shield-halved',
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, HMAC webhook signatures, WhatsApp-based 2FA, multi-sig withdrawals, and proof of reserves.',
  },
  {
    iconClass: 'fa-solid fa-file-invoice-dollar',
    title: 'Invoices & Refunds',
    description:
      'Generate professional invoices with line items, tax calculation, and PDF export. Full and partial refund support in original crypto or USDT.',
  },
  {
    iconClass: 'fa-solid fa-palette',
    title: 'White-Label Checkout',
    description:
      'Customize checkout with your logo, colors, and domain. Embeddable popup, inline, or full-page modes. Remove MyCryptoCoin branding entirely.',
  },
  {
    iconClass: 'fa-solid fa-language',
    title: '40+ Languages & 30+ Cryptos',
    description:
      'Support for 30+ cryptocurrencies including BTC, ETH, SOL, MATIC, AVAX, DOT, ADA, and L2s (Arbitrum, Optimism, Base). Multi-language checkout in 40+ languages with RTL support.',
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => {
                el.classList.add('aos-animate');
              }, i * 150);
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
    <section id="features" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            The Most Powerful <span className="text-gradient">Crypto Payment</span>
            <br className="hidden md:block" /> Gateway for Your Business
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Everything Boxcoin has, plus Lightning Network, invoices, refunds, white-label checkout,
            discount codes, Shopify integration, and 30+ cryptocurrencies.
          </p>
        </div>

        {/* 3x2 grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              data-aos="fade-up"
              className="glass-card rounded-2xl p-8 text-center group hover:border-white/10 transition-all"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                <i className={`${feature.iconClass} text-white text-2xl`} style={{ fontSize: '28px' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
