'use client';

import { useEffect, useRef } from 'react';

export default function Contact() {
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
    <section id="contact" className="relative py-20 md:py-28 overflow-hidden" ref={sectionRef}>
      {/* Decorative gradient orbs replacing shape images */}
      <div className="absolute top-10 right-10 w-[200px] h-[200px] opacity-20 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="orbGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="90" fill="url(#orbGrad1)">
            <animate attributeName="r" values="80;100;80" dur="6s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="absolute bottom-10 left-10 w-[150px] h-[150px] opacity-15 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="orbGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="85" ry="95" fill="url(#orbGrad2)">
            <animate attributeName="rx" values="75;95;75" dur="8s" repeatCount="indefinite" />
            <animate attributeName="ry" values="95;75;95" dur="8s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Start Accepting Crypto Today
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Tell us about your business and we will get you set up in minutes. Our team is ready to help you go live.
          </p>
        </div>

        <form className="glass-card rounded-2xl p-8 md:p-12" data-aos="fade-up" onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
              <input
                type="text"
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number</label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Business Type</label>
              <select className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm outline-none appearance-none">
                <option value="">Select your business type</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="saas">SaaS Platform</option>
                <option value="forex">Forex / Trading</option>
                <option value="travel">Travel / Airlines</option>
                <option value="realestate">Real Estate</option>
                <option value="gaming">Gaming</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
              <textarea
                placeholder="Tell us about your project..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm outline-none resize-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
