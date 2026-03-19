'use client';

import { useEffect, useRef } from 'react';

function DashboardSVG() {
  return (
    <svg viewBox="0 0 480 560" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="chartLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <filter id="dashGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="screenClip">
          <rect x="50" y="50" width="380" height="460" rx="20" />
        </clipPath>
      </defs>

      {/* Glassmorphism frame - outer glow */}
      <rect x="35" y="35" width="410" height="490" rx="28" fill="none" stroke="url(#dashGrad)" strokeWidth="1" opacity="0.3" />

      {/* Phone frame */}
      <rect x="40" y="40" width="400" height="480" rx="24" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

      {/* Glass reflection */}
      <rect x="40" y="40" width="400" height="480" rx="24" fill="url(#dashGrad)" opacity="0.03" />

      <g clipPath="url(#screenClip)">
        {/* Status bar */}
        <rect x="50" y="50" width="380" height="30" fill="rgba(255,255,255,0.02)" />
        <circle cx="70" cy="65" r="4" fill="#22C55E" opacity="0.6" />
        <rect x="340" y="61" width="30" height="8" rx="2" fill="white" opacity="0.15" />

        {/* Header */}
        <text x="70" y="110" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui" opacity="0.9">Dashboard</text>
        <circle cx="400" cy="105" r="14" fill="url(#dashGrad)" opacity="0.15" />
        <text x="400" y="110" textAnchor="middle" fill="#60A5FA" fontSize="12" fontFamily="system-ui" opacity="0.7">D</text>

        {/* Balance card */}
        <rect x="65" y="130" width="350" height="100" rx="16" fill="url(#dashGrad)" opacity="0.12" />
        <rect x="65" y="130" width="350" height="100" rx="16" fill="none" stroke="url(#dashGrad)" strokeWidth="1" opacity="0.2" />
        <text x="85" y="158" fill="white" fontSize="11" fontFamily="system-ui" opacity="0.5">Total Balance</text>
        <text x="85" y="190" fill="white" fontSize="28" fontWeight="bold" fontFamily="monospace" opacity="0.9">
          $127,845
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
        </text>
        <text x="85" y="215" fill="#4ADE80" fontSize="12" fontFamily="system-ui" opacity="0.7">+12.4% this week</text>
        {/* Mini sparkline in balance card */}
        <polyline points="320,200 330,190 340,195 350,180 360,175 370,165 380,170 390,160" fill="none" stroke="#4ADE80" strokeWidth="1.5" opacity="0.5" />

        {/* Chart section */}
        <text x="85" y="265" fill="white" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Revenue</text>
        <text x="350" y="265" fill="#60A5FA" fontSize="11" fontFamily="system-ui" opacity="0.5">7 days</text>

        {/* Chart area fill */}
        <path d="M85 380 L120 350 L160 360 L200 330 L240 310 L280 320 L320 290 L360 280 L395 260 L395 380 Z" fill="url(#chartLine)" opacity="0.08" />
        {/* Chart line */}
        <polyline
          points="85,380 120,350 160,360 200,330 240,310 280,320 320,290 360,280 395,260"
          fill="none"
          stroke="url(#chartLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="500"
          strokeDashoffset="500"
          opacity="0.8"
        >
          <animate attributeName="stroke-dashoffset" from="500" to="0" dur="2.5s" fill="freeze" />
        </polyline>
        {/* Chart dot at end */}
        <circle cx="395" cy="260" r="4" fill="#06B6D4" opacity="0">
          <animate attributeName="opacity" from="0" to="0.8" dur="2.5s" fill="freeze" />
          <animate attributeName="r" values="4;6;4" dur="2s" begin="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Transaction rows */}
        <rect x="65" y="400" width="350" height="48" rx="10" fill="rgba(255,255,255,0.03)" />
        <circle cx="90" cy="424" r="12" fill="#F7931A" opacity="0.2" />
        <text x="90" y="428" textAnchor="middle" fill="#F7931A" fontSize="10" fontWeight="bold" fontFamily="Arial">B</text>
        <text x="112" y="420" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui" opacity="0.7">Bitcoin</text>
        <text x="112" y="436" fill="white" fontSize="10" fontFamily="system-ui" opacity="0.4">0.42 BTC</text>
        <text x="385" y="420" textAnchor="end" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui" opacity="0.7">$18,240</text>
        <text x="385" y="436" textAnchor="end" fill="#4ADE80" fontSize="10" fontFamily="system-ui" opacity="0.5">+5.2%</text>

        <rect x="65" y="456" width="350" height="48" rx="10" fill="rgba(255,255,255,0.03)" />
        <circle cx="90" cy="480" r="12" fill="#627EEA" opacity="0.2" />
        <text x="90" y="484" textAnchor="middle" fill="#627EEA" fontSize="10" fontWeight="bold" fontFamily="Arial">E</text>
        <text x="112" y="476" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui" opacity="0.7">Ethereum</text>
        <text x="112" y="492" fill="white" fontSize="10" fontFamily="system-ui" opacity="0.4">12.5 ETH</text>
        <text x="385" y="476" textAnchor="end" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui" opacity="0.7">$24,180</text>
        <text x="385" y="492" textAnchor="end" fill="#4ADE80" fontSize="10" fontFamily="system-ui" opacity="0.5">+3.8%</text>
      </g>

      {/* Notification badge - popping in */}
      <g>
        <circle cx="405" cy="55" r="12" fill="#EF4444" opacity="0">
          <animate attributeName="opacity" values="0;0.9;0.9" dur="1s" begin="1.5s" fill="freeze" />
          <animate attributeName="r" values="0;14;12" dur="0.4s" begin="1.5s" fill="freeze" />
        </circle>
        <text x="405" y="59" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui" opacity="0">
          3
          <animate attributeName="opacity" values="0;1;1" dur="0.5s" begin="1.7s" fill="freeze" />
        </text>
      </g>

      {/* Second notification badge */}
      <g>
        <rect x="320" y="120" width="110" height="30" rx="8" fill="#22C55E" opacity="0">
          <animate attributeName="opacity" values="0;0.85;0.85" dur="0.5s" begin="2.5s" fill="freeze" />
        </rect>
        <text x="375" y="139" textAnchor="middle" fill="white" fontSize="9" fontWeight="600" fontFamily="system-ui" opacity="0">
          + $1,240 received
          <animate attributeName="opacity" values="0;1;1" dur="0.5s" begin="2.7s" fill="freeze" />
        </text>
      </g>
    </svg>
  );
}

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
      {/* Dark overlay background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-[#0a0a0f] to-purple-950/20" />
      <div className="absolute inset-0 bg-[#0a0a0f]/80" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Dashboard SVG Mockup */}
          <div className="flex-1 flex items-center justify-center relative min-h-[400px]" data-aos="fade-up">
            <div className="relative w-full max-w-sm">
              {/* Glow behind dashboard */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
              <DashboardSVG />
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
                <i className="fa-solid fa-chart-line" />
                Open Dashboard
              </a>
              <a
                href="#developers"
                className="px-6 py-3 rounded-lg text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-code" />
                View API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
