'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  stars: number;
  gradFrom: string;
  gradTo: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'CEO',
    company: 'TechMart E-commerce',
    quote: 'MyCryptoCoin cut our payment processing costs by 60%. The integration was seamless, and our international customers now have a frictionless checkout experience with crypto.',
    stars: 5,
    gradFrom: '#3B82F6',
    gradTo: '#8B5CF6',
  },
  {
    name: 'David Rodriguez',
    role: 'CTO',
    company: 'SwiftFX Trading',
    quote: 'Integration took literally 10 minutes. The API is clean, well-documented, and the webhook system is rock-solid. Best developer experience in the crypto payments space.',
    stars: 5,
    gradFrom: '#8B5CF6',
    gradTo: '#06B6D4',
  },
  {
    name: 'Amira Hassan',
    role: 'Head of Payments',
    company: 'SkyAir Airlines',
    quote: 'Our customers love paying with crypto for flight bookings. The instant settlement means we never worry about volatility, and the dashboard gives us complete visibility.',
    stars: 5,
    gradFrom: '#06B6D4',
    gradTo: '#3B82F6',
  },
  {
    name: "James O'Brien",
    role: 'CFO',
    company: 'BlockEstate Realty',
    quote: 'The WhatsApp notifications are genius. Every transaction, every withdrawal — I get real-time alerts. It feels like having a personal finance assistant for our crypto payments.',
    stars: 4.5,
    gradFrom: '#F59E0B',
    gradTo: '#EF4444',
  },
  {
    name: 'Priya Sharma',
    role: 'Lead Developer',
    company: 'GameVault',
    quote: 'Best API documentation I\'ve ever worked with. The code samples, the sandbox environment, the error handling — everything is thoughtfully designed for developers.',
    stars: 5,
    gradFrom: '#22C55E',
    gradTo: '#06B6D4',
  },
  {
    name: 'Marcus Weber',
    role: 'Risk Director',
    company: 'AlphaFX Brokers',
    quote: 'Proof of reserves gives our compliance team peace of mind. The transparency, combined with enterprise-grade security features, made MyCryptoCoin an easy choice for us.',
    stars: 5,
    gradFrom: '#8B5CF6',
    gradTo: '#EC4899',
  },
];

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<i key={i} className="fa-solid fa-star text-amber-400" style={{ fontSize: '14px' }} />);
    } else if (i - 0.5 === rating) {
      stars.push(<i key={i} className="fa-solid fa-star-half-stroke text-amber-400" style={{ fontSize: '14px' }} />);
    } else {
      stars.push(<i key={i} className="fa-regular fa-star text-amber-400/30" style={{ fontSize: '14px' }} />);
    }
  }
  return <div className="flex gap-1">{stars}</div>;
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % testimonials.length);
  }, [activeIndex, goTo]);

  // Auto-rotate
  useEffect(() => {
    intervalRef.current = setInterval(goNext, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext]);

  // AOS observer
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goTo((activeIndex + 1) % testimonials.length);
      } else {
        goTo((activeIndex - 1 + testimonials.length) % testimonials.length);
      }
    }
  };

  const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (activeIndex + 1) % testimonials.length;

  const featured = testimonials[activeIndex];
  const leftCard = testimonials[prevIndex];
  const rightCard = testimonials[nextIndex];

  return (
    <section className="py-20 md:py-28 overflow-hidden" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16" data-aos="fade-up">
          <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">Testimonials</div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            What Our Clients <span className="text-gradient">Say</span>
          </h2>
        </div>

        {/* Testimonial Carousel */}
        <div
          className="relative"
          data-aos="fade-up"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop: 3-card layout */}
          <div className="hidden lg:flex items-center justify-center gap-6">
            {/* Left side card */}
            <div
              className={`w-80 flex-shrink-0 transition-all duration-500 ${isTransitioning ? 'opacity-0 -translate-x-4' : 'opacity-60 scale-90'}`}
              onClick={() => goTo(prevIndex)}
              style={{ cursor: 'pointer' }}
            >
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${leftCard.gradFrom}40, ${leftCard.gradTo}40)` }}
                  >
                    <i className="fa-solid fa-user text-white/70" style={{ fontSize: '14px' }} />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{leftCard.name}</h4>
                    <span className="text-gray-500 text-xs">{leftCard.role}, {leftCard.company}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{leftCard.quote}</p>
              </div>
            </div>

            {/* Featured center card */}
            <div
              className={`w-[480px] flex-shrink-0 transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              <div className="relative rounded-2xl p-8 overflow-hidden" style={{ animation: 'card-glow 4s ease-in-out infinite' }}>
                {/* Animated gradient border */}
                <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${featured.gradFrom}60, ${featured.gradTo}60, ${featured.gradFrom}60)`,
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 3s linear infinite',
                    }}
                  />
                  <div className="absolute inset-[1px] rounded-2xl bg-[#0d0d15]" />
                </div>

                <div className="relative z-10">
                  {/* Quote icon */}
                  <i className="fa-solid fa-quote-left text-blue-500/10 absolute top-4 right-6" style={{ fontSize: '60px' }} />

                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${featured.gradFrom}, ${featured.gradTo})` }}
                    >
                      <i className="fa-solid fa-user text-white" style={{ fontSize: '20px' }} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{featured.name}</h4>
                      <span className="text-gray-400 text-sm">{featured.role}, {featured.company}</span>
                    </div>
                  </div>

                  <StarRating rating={featured.stars} />

                  <p className="text-gray-200 leading-relaxed mt-4 text-base">&ldquo;{featured.quote}&rdquo;</p>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                    <i className="fa-solid fa-building text-gray-500" style={{ fontSize: '14px' }} />
                    <span className="text-gray-500 text-sm">{featured.company}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side card */}
            <div
              className={`w-80 flex-shrink-0 transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-60 scale-90'}`}
              onClick={() => goTo(nextIndex)}
              style={{ cursor: 'pointer' }}
            >
              <div className="glass-card rounded-2xl p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${rightCard.gradFrom}40, ${rightCard.gradTo}40)` }}
                  >
                    <i className="fa-solid fa-user text-white/70" style={{ fontSize: '14px' }} />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">{rightCard.name}</h4>
                    <span className="text-gray-500 text-xs">{rightCard.role}, {rightCard.company}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{rightCard.quote}</p>
              </div>
            </div>
          </div>

          {/* Mobile: Single card view */}
          <div className="lg:hidden">
            <div
              className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              <div className="relative rounded-2xl p-6 overflow-hidden" style={{ animation: 'card-glow 4s ease-in-out infinite' }}>
                <div className="absolute inset-0 rounded-2xl p-[1px] overflow-hidden">
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${featured.gradFrom}60, ${featured.gradTo}60, ${featured.gradFrom}60)`,
                      backgroundSize: '200% 200%',
                      animation: 'shimmer 3s linear infinite',
                    }}
                  />
                  <div className="absolute inset-[1px] rounded-2xl bg-[#0d0d15]" />
                </div>

                <div className="relative z-10">
                  <i className="fa-solid fa-quote-left text-blue-500/10 absolute top-2 right-4" style={{ fontSize: '40px' }} />

                  <div className="flex items-center gap-4 mb-5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${featured.gradFrom}, ${featured.gradTo})` }}
                    >
                      <i className="fa-solid fa-user text-white" style={{ fontSize: '16px' }} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{featured.name}</h4>
                      <span className="text-gray-400 text-sm">{featured.role}, {featured.company}</span>
                    </div>
                  </div>

                  <StarRating rating={featured.stars} />

                  <p className="text-gray-200 leading-relaxed mt-4 text-sm">&ldquo;{featured.quote}&rdquo;</p>

                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/5">
                    <i className="fa-solid fa-building text-gray-500" style={{ fontSize: '12px' }} />
                    <span className="text-gray-500 text-xs">{featured.company}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIndex
                    ? 'w-8 h-2 bg-gradient-to-r from-blue-500 to-purple-500'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
