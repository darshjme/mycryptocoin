'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const services = [
  {
    number: '01',
    title: 'Payment Processing',
    titleSpan: 'Payment',
    titleRest: ' Processing',
    description:
      'Accept BTC, ETH, USDT and 10+ cryptocurrencies with a single API integration. Automatic rate conversion, instant confirmations, and real-time webhook notifications for every transaction.',
    image: '/images/shape/1.png',
    reverse: false,
  },
  {
    number: '02',
    title: 'Smart Wallet System',
    titleSpan: 'Smart',
    titleRest: ' Wallet System',
    description:
      'Automatic and manual withdrawals with HD wallet generation for every merchant. Real-time balance tracking across all supported cryptocurrencies with detailed transaction history.',
    image: '/images/shape/1.1.png',
    reverse: true,
  },
  {
    number: '03',
    title: 'Enterprise Security',
    titleSpan: 'Enterprise',
    titleRest: ' Security',
    description:
      'End-to-end encryption for all transactions. WhatsApp-based 2FA for account security. HMAC webhook signatures ensure tamper-proof communication between your server and ours.',
    image: '/images/shape/2.png',
    reverse: false,
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 200);
            });
          }
        });
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {services.map((service, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              service.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
            } items-center gap-12 lg:gap-20 mb-24 last:mb-0`}
            data-aos="fade-up"
          >
            {/* Text */}
            <div className="flex-1">
              <div className="text-6xl md:text-7xl font-extrabold text-white/5 mb-4 leading-none">
                {service.number}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                <span className="text-gradient">{service.titleSpan}</span>
                {service.titleRest}
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-lg">{service.description}</p>
              <a
                href="#developers"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors group"
              >
                Learn More
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center" data-aos="zoom-out">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-3xl blur-2xl" />
                <Image
                  src={service.image}
                  alt={service.title}
                  width={500}
                  height={400}
                  className="relative z-10 w-full object-contain"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
