'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function AppsOverview() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el) => {
              el.classList.add('aos-animate');
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
    <section className="relative py-20 md:py-28 overflow-hidden" ref={sectionRef}>
      {/* Dark overlay background matching template's apps-overview */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/home/bg2.png)' }}
      />
      <div className="absolute inset-0 bg-[#0a0a0f]/90" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Phone Mockups */}
          <div className="flex-1 flex items-center justify-center relative min-h-[400px]">
            <div className="relative" data-aos="fade-down" data-aos-duration="2500">
              <Image
                src="/images/home/s8.png"
                alt="Dashboard on Samsung"
                width={240}
                height={480}
                className="relative z-10 drop-shadow-2xl"
              />
            </div>
            <div
              className="relative -ml-16 mt-12"
              data-aos="fade-up"
              data-aos-duration="2500"
            >
              <Image
                src="/images/home/x.png"
                alt="Dashboard on iPhone"
                width={220}
                height={440}
                className="relative z-20 drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1" data-aos="fade-left">
            <h3 className="text-sm uppercase tracking-[3px] text-blue-400 mb-4 font-medium">
              Developer Dashboard
            </h3>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Control Everything From One Beautiful Interface.
            </h2>
            <h6 className="text-lg text-gray-300 mb-4 font-medium">
              Monitor transactions, manage wallets, and configure webhooks in real-time.
            </h6>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our developer dashboard gives you complete visibility into your payment operations. Track every transaction, monitor conversion rates, manage API keys, and configure automated withdrawals — all from a single, intuitive interface.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://dashboard.mycrypto.co.in"
                className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
                Open Dashboard
              </a>
              <a
                href="#developers"
                className="px-6 py-3 rounded-lg text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                View API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
