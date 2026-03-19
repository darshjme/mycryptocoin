'use client';

import { useState, useEffect, useRef } from 'react';

const faqLeft = [
  {
    q: 'What cryptocurrencies does MyCryptoCoin support?',
    a: 'We support Bitcoin (BTC), Ethereum (ETH), Tether (USDT), BNB, Solana (SOL), Polygon (MATIC), Litecoin (LTC), Dogecoin (DOGE), XRP, and more. New coins are added regularly based on merchant demand.',
  },
  {
    q: 'How do the fees work?',
    a: 'We charge a flat 0.5% fee per transaction. There are no monthly fees, no setup fees, no minimum volume requirements, and no hidden charges. You only pay when you process a payment.',
  },
  {
    q: 'How does the withdrawal process work?',
    a: 'You can set up automatic withdrawals to your wallet on a daily, weekly, or threshold basis. Manual withdrawals are also available anytime from the dashboard. All withdrawals are processed within minutes.',
  },
  {
    q: 'What security measures are in place?',
    a: 'We use end-to-end encryption, HMAC webhook signatures for tamper-proof server communication, WhatsApp-based 2FA for account security, and HD wallet generation for isolated merchant funds.',
  },
];

const faqRight = [
  {
    q: 'Do you have a WordPress / WooCommerce plugin?',
    a: 'Yes! Our official WooCommerce plugin lets you accept crypto payments in your WordPress store with one-click installation. It handles payment creation, webhook verification, and order status updates automatically.',
  },
  {
    q: 'Are there API rate limits?',
    a: 'Free tier accounts get 100 API calls per minute. This is more than sufficient for most merchants. If you need higher limits, contact us for enterprise plans with custom rate limits.',
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds can be initiated from the dashboard or via API. The refund is processed in the original cryptocurrency to the customer wallet. Refund fees are the same 0.5% rate.',
  },
  {
    q: 'Is KYC required?',
    a: 'Basic accounts require only WhatsApp verification. For higher transaction volumes or enterprise features, standard KYC documentation may be required to comply with regulations.',
  },
];

function AccordionItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="accordion-panel">
      <button className="accordion-header w-full" onClick={onClick}>
        <span className="text-left flex-1 pr-4">{q}</span>
        <svg
          className={`w-5 h-5 shrink-0 text-gray-400 accordion-chevron ${isOpen ? 'open' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
        <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openLeft, setOpenLeft] = useState(0);
  const [openRight, setOpenRight] = useState(-1);
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
    <section id="faq" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            MyCryptoCoin <span className="text-gradient">FAQ&apos;s</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6" data-aos="fade-up">
          <div className="space-y-0">
            {faqLeft.map((item, i) => (
              <AccordionItem
                key={i}
                q={item.q}
                a={item.a}
                isOpen={openLeft === i}
                onClick={() => setOpenLeft(openLeft === i ? -1 : i)}
              />
            ))}
          </div>
          <div className="space-y-0">
            {faqRight.map((item, i) => (
              <AccordionItem
                key={i}
                q={item.q}
                a={item.a}
                isOpen={openRight === i}
                onClick={() => setOpenRight(openRight === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
