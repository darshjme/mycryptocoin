'use client';

const partners = [
  {
    name: 'Bitcoin',
    color: '#F7931A',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#F7931A" opacity="0.15" />
        <circle cx="20" cy="20" r="16" stroke="#F7931A" strokeWidth="1" opacity="0.4" />
        <text x="20" y="26" textAnchor="middle" fill="#F7931A" fontSize="16" fontWeight="bold" fontFamily="Arial">&#x20BF;</text>
        <text x="48" y="24" fill="#F7931A" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Bitcoin</text>
      </svg>
    ),
  },
  {
    name: 'Ethereum',
    color: '#627EEA',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#627EEA" opacity="0.15" />
        <path d="M20 6 L30 20 L20 26 L10 20 Z" fill="#627EEA" opacity="0.5" />
        <path d="M20 28 L30 22 L20 36 L10 22 Z" fill="#627EEA" opacity="0.35" />
        <text x="48" y="24" fill="#627EEA" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Ethereum</text>
      </svg>
    ),
  },
  {
    name: 'Tether',
    color: '#26A17B',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#26A17B" opacity="0.15" />
        <circle cx="20" cy="20" r="16" stroke="#26A17B" strokeWidth="1" opacity="0.4" />
        <text x="20" y="26" textAnchor="middle" fill="#26A17B" fontSize="14" fontWeight="bold" fontFamily="Arial">&#x20AE;</text>
        <text x="48" y="24" fill="#26A17B" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Tether</text>
      </svg>
    ),
  },
  {
    name: 'BNB',
    color: '#F3BA2F',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#F3BA2F" opacity="0.15" />
        <path d="M20 8 L26 14 L22 18 L28 24 L20 32 L12 24 L18 18 L14 14 Z" fill="#F3BA2F" opacity="0.5" />
        <text x="48" y="24" fill="#F3BA2F" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">BNB</text>
      </svg>
    ),
  },
  {
    name: 'Solana',
    color: '#9945FF',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#9945FF" opacity="0.15" />
        <rect x="10" y="12" width="20" height="3" rx="1" fill="#9945FF" opacity="0.5" transform="skewX(-10)" />
        <rect x="10" y="19" width="20" height="3" rx="1" fill="#9945FF" opacity="0.5" transform="skewX(10)" />
        <rect x="10" y="26" width="20" height="3" rx="1" fill="#9945FF" opacity="0.5" transform="skewX(-10)" />
        <text x="48" y="24" fill="#9945FF" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Solana</text>
      </svg>
    ),
  },
  {
    name: 'Polygon',
    color: '#8247E5',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#8247E5" opacity="0.15" />
        <polygon points="20,8 32,16 32,28 20,36 8,28 8,16" fill="none" stroke="#8247E5" strokeWidth="1.5" opacity="0.5" />
        <text x="48" y="24" fill="#8247E5" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Polygon</text>
      </svg>
    ),
  },
  {
    name: 'Litecoin',
    color: '#BFBBBB',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#BFBBBB" opacity="0.15" />
        <circle cx="20" cy="20" r="16" stroke="#BFBBBB" strokeWidth="1" opacity="0.4" />
        <text x="20" y="27" textAnchor="middle" fill="#BFBBBB" fontSize="18" fontWeight="bold" fontFamily="Arial">L</text>
        <text x="48" y="24" fill="#BFBBBB" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Litecoin</text>
      </svg>
    ),
  },
  {
    name: 'Dogecoin',
    color: '#C3A634',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#C3A634" opacity="0.15" />
        <circle cx="20" cy="20" r="16" stroke="#C3A634" strokeWidth="1" opacity="0.4" />
        <text x="20" y="27" textAnchor="middle" fill="#C3A634" fontSize="16" fontWeight="bold" fontFamily="Arial">D</text>
        <text x="48" y="24" fill="#C3A634" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">Dogecoin</text>
      </svg>
    ),
  },
  {
    name: 'XRP',
    color: '#23292F',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#E2E8F0" opacity="0.1" />
        <circle cx="20" cy="20" r="16" stroke="#E2E8F0" strokeWidth="1" opacity="0.3" />
        <text x="20" y="25" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="bold" fontFamily="Arial">XRP</text>
        <text x="48" y="24" fill="#E2E8F0" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">XRP</text>
      </svg>
    ),
  },
  {
    name: 'USDC',
    color: '#2775CA',
    svg: (
      <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#2775CA" opacity="0.15" />
        <circle cx="20" cy="20" r="16" stroke="#2775CA" strokeWidth="1" opacity="0.4" />
        <text x="20" y="25" textAnchor="middle" fill="#2775CA" fontSize="9" fontWeight="bold" fontFamily="Arial">USDC</text>
        <text x="48" y="24" fill="#2775CA" fontSize="13" fontWeight="600" fontFamily="system-ui" opacity="0.7">USDC</text>
      </svg>
    ),
  },
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
          {doubled.map((partner, i) => (
            <a
              key={i}
              href="#"
              className="shrink-0 opacity-40 hover:opacity-70 transition-opacity"
              title={partner.name}
            >
              <div className="w-[120px] h-[40px]">
                {partner.svg}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
