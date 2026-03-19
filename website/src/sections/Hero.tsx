'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section id="theme-banner" className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-12">
      {/* Floating Bitcoin Icon */}
      <div className="absolute top-[15%] left-[5%] w-16 h-16 opacity-40 pointer-events-none" style={{ animation: 'float 6s ease-in-out infinite' }}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="url(#btcGrad)" opacity="0.15" />
          <circle cx="32" cy="32" r="24" stroke="url(#btcGrad)" strokeWidth="2" opacity="0.6" />
          <text x="32" y="40" textAnchor="middle" fill="#F7931A" fontSize="24" fontWeight="bold" fontFamily="Arial">&#x20BF;</text>
          <defs>
            <linearGradient id="btcGrad" x1="0" y1="0" x2="64" y2="64">
              <stop stopColor="#F7931A" />
              <stop offset="1" stopColor="#FFCB47" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Ethereum Icon */}
      <div className="absolute top-[25%] right-[8%] w-12 h-12 opacity-40 pointer-events-none" style={{ animation: 'spin-slow 20s linear infinite' }}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="22" fill="url(#ethGrad)" opacity="0.15" />
          <path d="M24 6 L36 24 L24 32 L12 24 Z" fill="url(#ethGrad)" opacity="0.6" />
          <path d="M24 36 L36 26 L24 44 L12 26 Z" fill="url(#ethGrad)" opacity="0.4" />
          <defs>
            <linearGradient id="ethGrad" x1="0" y1="0" x2="48" y2="48">
              <stop stopColor="#627EEA" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Shield Icon */}
      <div className="absolute bottom-[20%] left-[10%] w-10 h-10 opacity-40 pointer-events-none" style={{ animation: 'pulse-ring 3s ease-in-out infinite' }}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4 L34 10 L34 22 C34 30 28 36 20 38 C12 36 6 30 6 22 L6 10 Z" fill="#22C55E" stroke="#22C55E" strokeWidth="1.5" opacity="0.6" />
          <rect x="17" y="16" width="6" height="8" rx="1" fill="#22C55E" opacity="0.6" />
          <circle cx="20" cy="14" r="3" fill="none" stroke="#22C55E" strokeWidth="1.5" opacity="0.6" />
        </svg>
      </div>

      {/* Floating Chart Icon */}
      <div className="absolute bottom-[30%] right-[25%] w-14 h-14 opacity-40 pointer-events-none" style={{ animation: 'float 4s ease-in-out 1s infinite' }}>
        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="26" fill="#06B6D4" opacity="0.1" />
          <polyline points="8,42 18,30 26,35 36,18 48,12" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze" />
            <animate attributeName="stroke-dasharray" from="0,100" to="100,0" dur="2s" fill="freeze" />
          </polyline>
          <circle cx="48" cy="12" r="3" fill="#06B6D4" opacity="0.8">
            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Round gradient shapes */}
      <div className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-sm animate-float pointer-events-none" />
      <div className="absolute top-[60%] left-[3%] w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/10 blur-sm animate-float-delayed pointer-events-none" />

      {/* Hero SVG Illustration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45%] max-w-[600px] opacity-30 lg:opacity-60 pointer-events-none hidden lg:block">
        <svg viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="coinInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glow pulse */}
          <circle cx="300" cy="300" r="180" fill="url(#glowGrad)">
            <animate attributeName="r" values="160;200;160" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
          </circle>

          {/* Connection lines */}
          <g opacity="0.2">
            <line x1="300" y1="300" x2="140" y2="160" stroke="#3B82F6" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="300" x2="460" y2="160" stroke="#8B5CF6" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3.5s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="300" x2="140" y2="440" stroke="#06B6D4" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="300" x2="460" y2="440" stroke="#3B82F6" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="300" x2="300" y2="100" stroke="#A78BFA" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3.2s" repeatCount="indefinite" />
            </line>
            <line x1="300" y1="300" x2="300" y2="500" stroke="#60A5FA" strokeWidth="1">
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.8s" repeatCount="indefinite" />
            </line>
          </g>

          {/* Connection nodes */}
          <g filter="url(#glow)">
            <circle cx="140" cy="160" r="6" fill="#3B82F6" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="460" cy="160" r="6" fill="#8B5CF6" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="440" r="6" fill="#06B6D4" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="460" cy="440" r="6" fill="#3B82F6" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="100" r="6" fill="#A78BFA" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="500" r="6" fill="#60A5FA" opacity="0.6">
              <animate attributeName="r" values="4;8;4" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Central coin - outer ring */}
          <circle cx="300" cy="300" r="100" fill="none" stroke="url(#coinGrad)" strokeWidth="3" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="30s" repeatCount="indefinite" />
          </circle>

          {/* Central coin - inner */}
          <circle cx="300" cy="300" r="80" fill="url(#coinGrad)" opacity="0.15" />
          <circle cx="300" cy="300" r="80" fill="none" stroke="url(#coinInner)" strokeWidth="2" strokeDasharray="8 4" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="360 300 300" to="0 300 300" dur="20s" repeatCount="indefinite" />
          </circle>

          {/* Dollar sign in center */}
          <text x="300" y="315" textAnchor="middle" fill="url(#coinInner)" fontSize="50" fontWeight="bold" fontFamily="Arial" opacity="0.7">$</text>

          {/* Orbiting BTC */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 300 300" to="360 300 300" dur="12s" repeatCount="indefinite" />
            <circle cx="300" cy="160" r="22" fill="#F7931A" opacity="0.2" />
            <circle cx="300" cy="160" r="22" fill="none" stroke="#F7931A" strokeWidth="1.5" opacity="0.5" />
            <text x="300" y="167" textAnchor="middle" fill="#F7931A" fontSize="16" fontWeight="bold" fontFamily="Arial">&#x20BF;</text>
          </g>

          {/* Orbiting ETH */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="120 300 300" to="480 300 300" dur="15s" repeatCount="indefinite" />
            <circle cx="300" cy="170" r="20" fill="#627EEA" opacity="0.2" />
            <circle cx="300" cy="170" r="20" fill="none" stroke="#627EEA" strokeWidth="1.5" opacity="0.5" />
            <text x="300" y="176" textAnchor="middle" fill="#627EEA" fontSize="12" fontWeight="bold" fontFamily="Arial">ETH</text>
          </g>

          {/* Orbiting USDT */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="240 300 300" to="600 300 300" dur="18s" repeatCount="indefinite" />
            <circle cx="300" cy="175" r="18" fill="#26A17B" opacity="0.2" />
            <circle cx="300" cy="175" r="18" fill="none" stroke="#26A17B" strokeWidth="1.5" opacity="0.5" />
            <text x="300" y="180" textAnchor="middle" fill="#26A17B" fontSize="10" fontWeight="bold" fontFamily="Arial">USDT</text>
          </g>
        </svg>
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
