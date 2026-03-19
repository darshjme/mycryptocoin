'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section id="theme-banner" className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12">
      {/* Decorative floating shapes - matching template's icon-shape and round-shape */}
      <div className="absolute top-[15%] left-[5%] w-16 h-16 opacity-20 animate-float pointer-events-none">
        <Image src="/images/icon/1.png" alt="" width={64} height={64} />
      </div>
      <div className="absolute top-[25%] right-[8%] w-12 h-12 opacity-20 animate-float-delayed pointer-events-none">
        <Image src="/images/icon/2.png" alt="" width={48} height={48} />
      </div>
      <div className="absolute bottom-[20%] left-[10%] w-10 h-10 opacity-20 animate-float-slow pointer-events-none">
        <Image src="/images/icon/3.png" alt="" width={40} height={40} />
      </div>

      {/* Round gradient shapes */}
      <div className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-sm animate-float pointer-events-none" />
      <div className="absolute bottom-[30%] right-[25%] w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-500/10 blur-sm animate-float-slow pointer-events-none">
        <Image src="/images/icon/4.png" alt="" width={80} height={80} className="opacity-40" />
      </div>
      <div className="absolute top-[60%] left-[3%] w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/10 blur-sm animate-float-delayed pointer-events-none" />

      {/* Hero illustration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45%] max-w-[600px] opacity-30 lg:opacity-50 pointer-events-none hidden lg:block">
        <Image
          src="/images/home/k.png"
          alt="Crypto illustration"
          width={600}
          height={600}
          priority
          className="object-contain"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div
          className={`max-w-3xl transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Accept Crypto
            <br />
            <span className="text-gradient">Payments Globally.</span>
            <br />
            <span className="text-white/90">Revolution starts here.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed">
            A revolutionary crypto payment gateway for the future of digital commerce.
            Just <span className="text-blue-400 font-semibold">0.5%</span> per transaction.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://dashboard.mycrypto.co.in/register"
              className="px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Get Started Free
            </a>
            <a
              href="#developers"
              className="px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              View Documentation
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
