'use client';

import { useEffect, useRef } from 'react';

const testimonials = [
  {
    name: 'Rajiv Mehta',
    role: 'CEO, TechShop E-commerce',
    quote:
      '"MyCryptoCoin transformed our checkout flow. We added crypto payments in under an hour with their WooCommerce plugin. Our crypto orders grew 40% in the first month, and the 0.5% fee is unbeatable."',
    initials: 'RM',
  },
  {
    name: 'Sarah Chen',
    role: 'CTO, SwiftFX Trading',
    quote:
      '"The API is incredibly clean — reminds me of Stripe. We integrated crypto deposits for our trading platform in a single sprint. The webhook signatures and real-time confirmations give us complete confidence."',
    initials: 'SC',
  },
  {
    name: 'David Okonkwo',
    role: 'Head of Payments, SkyAir Airlines',
    quote:
      '"Handling high-value flight bookings in crypto seemed risky, but MyCryptoCoin\'s instant settlement and enterprise security made it seamless. Our international customers love the option."',
    initials: 'DO',
  },
  {
    name: 'Rajiv Mehta',
    role: 'CEO, TechShop E-commerce',
    quote:
      '"MyCryptoCoin transformed our checkout flow. We added crypto payments in under an hour with their WooCommerce plugin. Our crypto orders grew 40% in the first month, and the 0.5% fee is unbeatable."',
    initials: 'RM',
  },
  {
    name: 'Sarah Chen',
    role: 'CTO, SwiftFX Trading',
    quote:
      '"The API is incredibly clean — reminds me of Stripe. We integrated crypto deposits for our trading platform in a single sprint. The webhook signatures and real-time confirmations give us complete confidence."',
    initials: 'SC',
  },
  {
    name: 'David Okonkwo',
    role: 'Head of Payments, SkyAir Airlines',
    quote:
      '"Handling high-value flight bookings in crypto seemed risky, but MyCryptoCoin\'s instant settlement and enterprise security made it seamless. Our international customers love the option."',
    initials: 'DO',
  },
];

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el) =>
              el.classList.add('aos-animate')
            );
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12" data-aos="fade-up">
          <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">Testimonials</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Our Client <span className="text-gradient">Testimonials</span>
          </h2>
        </div>

        {/* Carousel - horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          data-aos="fade-up"
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="min-w-[340px] md:min-w-[420px] flex-shrink-0 snap-start"
            >
              <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{t.name}</h3>
                    <span className="text-gray-500 text-sm">{t.role}</span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-sm flex-1">{t.quote}</p>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
