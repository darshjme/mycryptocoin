'use client';

import { useEffect, useRef } from 'react';

function PaymentProcessingSVG() {
  return (
    <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="coinGradS" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#FFCB47" />
        </linearGradient>
        <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
      </defs>

      {/* Credit Card */}
      <rect x="40" y="140" width="120" height="80" rx="12" fill="url(#cardGrad)" opacity="0.8" />
      <rect x="55" y="160" width="40" height="10" rx="2" fill="white" opacity="0.4" />
      <rect x="55" y="178" width="60" height="6" rx="2" fill="white" opacity="0.2" />
      <rect x="55" y="190" width="30" height="6" rx="2" fill="white" opacity="0.2" />
      <circle cx="135" cy="200" r="12" fill="white" opacity="0.15" />

      {/* Animated arrows */}
      <g opacity="0.6">
        <path d="M175 180 L225 180" stroke="#60A5FA" strokeWidth="2" strokeDasharray="6 4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
        </path>
        <polygon points="225,175 235,180 225,185" fill="#60A5FA">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </g>

      {/* Crypto coins cluster */}
      <circle cx="290" cy="165" r="25" fill="url(#coinGradS)" opacity="0.3" />
      <circle cx="290" cy="165" r="25" stroke="#F7931A" strokeWidth="1.5" opacity="0.6" />
      <text x="290" y="172" textAnchor="middle" fill="#F7931A" fontSize="18" fontWeight="bold" fontFamily="Arial">&#x20BF;</text>

      <circle cx="310" cy="200" r="22" fill="#627EEA" opacity="0.2" />
      <circle cx="310" cy="200" r="22" stroke="#627EEA" strokeWidth="1.5" opacity="0.5" />
      <text x="310" y="206" textAnchor="middle" fill="#627EEA" fontSize="11" fontWeight="bold" fontFamily="Arial">ETH</text>

      <circle cx="270" cy="205" r="18" fill="#26A17B" opacity="0.2" />
      <circle cx="270" cy="205" r="18" stroke="#26A17B" strokeWidth="1.5" opacity="0.5" />
      <text x="270" y="210" textAnchor="middle" fill="#26A17B" fontSize="9" fontWeight="bold" fontFamily="Arial">USDT</text>

      {/* Animated arrows to checkmark */}
      <g opacity="0.6">
        <path d="M345 185 L395 185" stroke="#4ADE80" strokeWidth="2" strokeDasharray="6 4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
        </path>
        <polygon points="395,180 405,185 395,190" fill="#4ADE80">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
        </polygon>
      </g>

      {/* Checkmark circle */}
      <circle cx="440" cy="185" r="30" fill="url(#checkGrad)" opacity="0.15" />
      <circle cx="440" cy="185" r="30" stroke="url(#checkGrad)" strokeWidth="2" opacity="0.6">
        <animate attributeName="r" values="28;32;28" dur="3s" repeatCount="indefinite" />
      </circle>
      <polyline points="425,185 435,195 455,175" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />

      {/* Subtle particle dots */}
      <circle cx="200" cy="150" r="2" fill="#60A5FA" opacity="0.4">
        <animate attributeName="cy" values="150;140;150" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="350" cy="160" r="2" fill="#A78BFA" opacity="0.4">
        <animate attributeName="cy" values="160;150;160" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function SmartWalletSVG() {
  return (
    <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Wallet body */}
      <rect x="150" y="120" width="200" height="160" rx="20" fill="url(#walletGrad)" opacity="0.15" />
      <rect x="150" y="120" width="200" height="160" rx="20" stroke="url(#walletGrad)" strokeWidth="2" opacity="0.5" />

      {/* Wallet flap */}
      <path d="M150 160 Q150 140 170 140 L330 140 Q350 140 350 160 L350 175 L150 175 Z" fill="url(#walletGrad)" opacity="0.25" />

      {/* Wallet clasp */}
      <rect x="310" y="190" width="55" height="30" rx="15" fill="url(#walletGrad)" opacity="0.3" />
      <circle cx="340" cy="205" r="8" fill="#60A5FA" opacity="0.6" />

      {/* Balance text */}
      <text x="200" y="220" fill="#E2E8F0" fontSize="14" fontFamily="monospace" opacity="0.7">Balance</text>
      <text x="200" y="250" fill="white" fontSize="24" fontWeight="bold" fontFamily="monospace" opacity="0.8">
        $47,832
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </text>

      {/* Coins flowing in from left */}
      <g opacity="0.6">
        <circle cx="80" cy="180" r="14" fill="#F7931A" opacity="0.4">
          <animate attributeName="cx" values="60;140;60" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="90" cy="210" r="12" fill="#627EEA" opacity="0.4">
          <animate attributeName="cx" values="70;140;70" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Coins flowing out right */}
      <g opacity="0.6">
        <circle cx="400" cy="190" r="12" fill="#26A17B" opacity="0.4">
          <animate attributeName="cx" values="360;440;360" dur="4.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur="4.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Sparkle effects */}
      <circle cx="180" cy="140" r="3" fill="#60A5FA" opacity="0.5">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="320" cy="130" r="2" fill="#A78BFA" opacity="0.5">
        <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function EnterpriseSecuritySVG() {
  return (
    <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Shield */}
      <path d="M250 80 L370 120 L370 220 C370 290 320 340 250 360 C180 340 130 290 130 220 L130 120 Z" fill="url(#shieldGrad)" opacity="0.1">
        <animate attributeName="opacity" values="0.08;0.15;0.08" dur="4s" repeatCount="indefinite" />
      </path>
      <path d="M250 80 L370 120 L370 220 C370 290 320 340 250 360 C180 340 130 290 130 220 L130 120 Z" fill="none" stroke="url(#shieldGrad)" strokeWidth="2" opacity="0.5" />

      {/* Pulse ring around shield */}
      <path d="M250 90 L360 127 L360 218 C360 283 314 330 250 350 C186 330 140 283 140 218 L140 127 Z" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.3">
        <animate attributeName="opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="3s" repeatCount="indefinite" additive="sum" />
      </path>

      {/* Lock body */}
      <rect x="225" y="200" width="50" height="40" rx="6" fill="url(#shieldGrad)" opacity="0.4" />
      {/* Lock shackle */}
      <path d="M235 200 L235 185 Q235 165 250 165 Q265 165 265 185 L265 200" fill="none" stroke="url(#shieldGrad)" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      {/* Keyhole */}
      <circle cx="250" cy="218" r="5" fill="white" opacity="0.5" />
      <rect x="248" y="218" width="4" height="10" rx="1" fill="white" opacity="0.4" />

      {/* Data streams */}
      <g opacity="0.3">
        <text x="70" y="160" fill="#60A5FA" fontSize="8" fontFamily="monospace">
          0x4f3a...
          <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite" />
        </text>
        <text x="60" y="180" fill="#A78BFA" fontSize="8" fontFamily="monospace">
          SHA256...
          <animate attributeName="opacity" values="0;0.6;0" dur="2.5s" repeatCount="indefinite" />
        </text>
        <text x="75" y="200" fill="#22D3EE" fontSize="8" fontFamily="monospace">
          HMAC...
          <animate attributeName="opacity" values="0;0.6;0" dur="3.5s" repeatCount="indefinite" />
        </text>
        <text x="55" y="220" fill="#60A5FA" fontSize="8" fontFamily="monospace">
          E2E-ENC
          <animate attributeName="opacity" values="0;0.6;0" dur="2.8s" repeatCount="indefinite" />
        </text>

        <text x="380" y="170" fill="#A78BFA" fontSize="8" fontFamily="monospace">
          ...7b2e
          <animate attributeName="opacity" values="0;0.6;0" dur="2.7s" repeatCount="indefinite" />
        </text>
        <text x="390" y="190" fill="#60A5FA" fontSize="8" fontFamily="monospace">
          AES256
          <animate attributeName="opacity" values="0;0.6;0" dur="3.2s" repeatCount="indefinite" />
        </text>
        <text x="375" y="210" fill="#22D3EE" fontSize="8" fontFamily="monospace">
          HD-KEY
          <animate attributeName="opacity" values="0;0.6;0" dur="2.3s" repeatCount="indefinite" />
        </text>
        <text x="385" y="230" fill="#A78BFA" fontSize="8" fontFamily="monospace">
          2FA-WA
          <animate attributeName="opacity" values="0;0.6;0" dur="3.8s" repeatCount="indefinite" />
        </text>
      </g>

      {/* Checkmark in shield */}
      <polyline points="235,170 245,180 270,155" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

const services = [
  {
    number: '01',
    titleSpan: 'Payment',
    titleRest: ' Processing',
    description:
      'Accept BTC, ETH, SOL and 30+ cryptocurrencies including Lightning Network for instant BTC payments. Hosted checkout pages, embeddable widgets, and multiple display modes (popup, inline, full page). Automatic rate conversion, real-time webhooks, and Shopify integration.',
    SvgComponent: PaymentProcessingSVG,
    reverse: false,
  },
  {
    number: '02',
    titleSpan: 'Smart',
    titleRest: ' Wallet System',
    description:
      'HD wallet generation for every merchant with auto-convert to USDT. Professional invoicing with line items, tax calculation, and PDF export. Full and partial refunds, discount codes, and exchange rate API. Support for custom ERC-20/BEP-20/TRC-20 tokens.',
    SvgComponent: SmartWalletSVG,
    reverse: true,
  },
  {
    number: '03',
    titleSpan: 'Enterprise',
    titleRest: ' Security',
    description:
      'End-to-end encryption, WhatsApp-based 2FA, HMAC webhook signatures, and testnet support (Bitcoin Testnet3, Ethereum Sepolia, Solana Devnet). White-label checkout with custom domains, branding, and 40+ language support including RTL.',
    SvgComponent: EnterpriseSecuritySVG,
    reverse: false,
  },
];

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-aos]').forEach((el, i) => {
              setTimeout(() => el.classList.add('aos-animate'), i * 200);
            });
          }
        });
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" className="py-20 md:py-28" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {services.map((service, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              service.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
            } items-center gap-12 lg:gap-20 mb-24 last:mb-0`}
            data-aos="fade-up"
          >
            {/* Text */}
            <div className="flex-1">
              <div className="text-6xl md:text-7xl font-extrabold text-white/5 mb-4 leading-none">
                {service.number}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                <span className="text-gradient">{service.titleSpan}</span>
                {service.titleRest}
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-lg">{service.description}</p>
              <a
                href="#developers"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors group"
              >
                Learn More
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            {/* SVG Illustration */}
            <div className="flex-1 flex items-center justify-center" data-aos="zoom-out">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-3xl blur-2xl" />
                <div className="relative z-10">
                  <service.SvgComponent />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
