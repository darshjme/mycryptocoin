'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const features = [
  {
    icon: '/images/icon/5.png',
    title: 'Multi-Crypto Support',
    description:
      'Accept BTC, ETH, USDT, SOL, BNB, and 10+ cryptocurrencies through a single unified API integration.',
  },
  {
    icon: '/images/icon/6.png',
    title: 'Instant Settlement',
    description:
      'Real-time payment confirmations with auto-conversion. Funds settle to your wallet within minutes, not days.',
  },
  {
    icon: '/images/icon/7.png',
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, HMAC webhook signatures, WhatsApp-based 2FA, and HD wallet generation for maximum protection.',
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
        {/* Section Title - template style */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            The Most Powerful <span className="text-gradient">Crypto Payment</span>
            <br className="hidden md:block" /> Gateway for Your Business
          </h2>
        </div>

        {/* 3-column grid matching template's .our-features-one */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              data-aos="fade-up"
              className={`glass-card rounded-2xl p-8 text-center group ${
                i === 1 ? 'md:border-x md:border-y-0 md:rounded-none md:border-white/5' : ''
              }`}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={48}
                  height={48}
                  className="opacity-80 group-hover:opacity-100 transition-opacity"
                />
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
