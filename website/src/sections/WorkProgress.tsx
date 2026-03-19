'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const steps = [
  {
    num: 1,
    icon: '/images/icon/11.png',
    title: 'Sign Up with WhatsApp',
    description: 'Create your account in seconds using WhatsApp verification. No lengthy KYC for basic accounts.',
  },
  {
    num: 2,
    icon: '/images/icon/12.png',
    title: 'Get API Keys',
    description: 'Generate your live and test API keys instantly from the developer dashboard.',
  },
  {
    num: 3,
    icon: '/images/icon/13.png',
    title: 'Integrate SDK',
    description: 'Use our REST API, WordPress plugin, or pre-built SDKs to start accepting payments.',
  },
  {
    num: 4,
    icon: '/images/icon/11.png',
    title: 'Accept Payments',
    description: 'Your customers pay in crypto. We handle conversion, confirmation, and settlement.',
  },
  {
    num: 5,
    icon: '/images/icon/12.png',
    title: 'Auto Withdraw',
    description: 'Funds are automatically sent to your wallet on your schedule, or withdraw manually anytime.',
  },
];

export default function WorkProgress() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 150);
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
    <section id="progress" className="py-20 md:py-28 relative overflow-hidden" ref={sectionRef}>
      {/* Background matching template's bg-color */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-12 mb-16">
          <div className="lg:w-1/3" data-aos="fade-right">
            <div className="text-sm uppercase tracking-[3px] text-gray-500 mb-4 font-medium">Solutions</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              <span className="text-gradient">Work</span> Process & Solutions.
            </h2>
            <p className="text-gray-400 mt-4 leading-relaxed">
              We put your payment needs into a seamless flow that works in minutes, not days. Five simple steps to crypto payments.
            </p>
          </div>
        </div>

        {/* Progress cards - horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible scrollbar-hide">
          {steps.map((step, i) => (
            <div
              key={i}
              className="min-w-[260px] lg:min-w-0 flex-shrink-0"
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
            >
              <div className="glass-card rounded-2xl p-6 h-full relative group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Image src={step.icon} alt={step.title} width={32} height={32} className="opacity-80" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                <div className="absolute bottom-4 right-4 text-5xl font-extrabold text-white/[0.04] leading-none">
                  {step.num}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
