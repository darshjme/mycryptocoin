'use client';

import { useEffect, useRef, useState } from 'react';

interface CounterItemProps {
  target: number;
  suffix: string;
  label: string;
  inView: boolean;
}

function CounterItem({ target, suffix, label, inView }: CounterItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div className="text-center">
      <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-2">
        <span>{count}</span>
        <span className="text-gradient">{suffix}</span>
      </h2>
      <p className="text-gray-400 text-sm md:text-base">{label}</p>
    </div>
  );
}

const counters = [
  { target: 500, suffix: '+', label: 'Active Merchants' },
  { target: 10, suffix: '+', label: 'Cryptocurrencies' },
  { target: 50, suffix: 'M+', label: 'USD Processed' },
];

export default function Counter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          entry.target.querySelectorAll('[data-aos]').forEach((el) =>
            el.classList.add('aos-animate')
          );
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 mb-16" data-aos="fade-up">
              <div className="flex-1">
                <p className="text-gray-400 leading-relaxed max-w-lg">
                  We are the fastest growing crypto payment gateway with strong merchant community and enterprise-grade security. Here are some numbers that speak for themselves.
                </p>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  <span className="text-gradient">Fastest</span> Growing Crypto Payment Network.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12" data-aos="fade-up">
              {counters.map((c, i) => (
                <CounterItem key={i} {...c} inView={inView} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
