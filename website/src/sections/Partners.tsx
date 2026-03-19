'use client';

import Image from 'next/image';

const partners = [
  '/images/logo/p-1.png',
  '/images/logo/p-2.png',
  '/images/logo/p-3.png',
  '/images/logo/p-4.png',
  '/images/logo/p-5.png',
  '/images/logo/p-6.png',
  '/images/logo/p-7.png',
  '/images/logo/p-8.png',
  '/images/logo/p-9.png',
  '/images/logo/p-10.png',
];

export default function Partners() {
  const doubled = [...partners, ...partners];

  return (
    <section className="py-16 overflow-hidden">
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-12 animate-scroll-left" style={{ width: 'max-content' }}>
          {doubled.map((src, i) => (
            <a
              key={i}
              href="#"
              className="shrink-0 opacity-30 hover:opacity-60 transition-opacity"
            >
              <Image
                src={src}
                alt="Partner"
                width={120}
                height={40}
                className="h-10 w-auto object-contain grayscale"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
