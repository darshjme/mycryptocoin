'use client';

const cryptos = [
  { name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { name: 'Tether', symbol: 'USDT', color: '#26A17B' },
  { name: 'USD Coin', symbol: 'USDC', color: '#2775CA' },
  { name: 'BNB', symbol: 'BNB', color: '#F3BA2F' },
  { name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  { name: 'Litecoin', symbol: 'LTC', color: '#BFBBBB' },
  { name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633' },
  { name: 'XRP', symbol: 'XRP', color: '#23292F' },
  { name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
  { name: 'Polkadot', symbol: 'DOT', color: '#E6007A' },
  { name: 'Cardano', symbol: 'ADA', color: '#0033AD' },
  { name: 'TRON', symbol: 'TRX', color: '#FF0013' },
  { name: 'Monero', symbol: 'XMR', color: '#FF6600' },
  { name: 'Zcash', symbol: 'ZEC', color: '#ECB244' },
  { name: 'Bitcoin Cash', symbol: 'BCH', color: '#0AC18E' },
  { name: 'Chainlink', symbol: 'LINK', color: '#2A5ADA' },
  { name: 'Uniswap', symbol: 'UNI', color: '#FF007A' },
  { name: 'Aave', symbol: 'AAVE', color: '#B6509E' },
  { name: 'Dai', symbol: 'DAI', color: '#F5AC37' },
  { name: 'Shiba Inu', symbol: 'SHIB', color: '#FFA409' },
  { name: 'Pepe', symbol: 'PEPE', color: '#3E8A2D' },
  { name: 'Arbitrum', symbol: 'ARB', color: '#213147' },
  { name: 'Optimism', symbol: 'OP', color: '#FF0420' },
  { name: 'Base', symbol: 'BASE', color: '#0052FF' },
  { name: 'Lightning', symbol: 'LN', color: '#F7931A' },
];

function CryptoBadge({ name, symbol, color }: { name: string; symbol: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 rounded-full glass border border-white/5 hover:border-white/10 transition-all shrink-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{ background: color }}
      >
        {symbol.slice(0, 2)}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-gray-500">{symbol}</div>
      </div>
    </div>
  );
}

export default function SupportedCryptos() {
  const doubled = [...cryptos, ...cryptos];

  return (
    <section className="py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            <span className="text-gradient">30+</span> Supported Cryptocurrencies
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Including Lightning Network, L2 rollups (Arbitrum, Optimism, Base), and custom ERC-20/BEP-20 tokens
          </p>
        </div>
      </div>

      {/* Scrolling banner */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-scroll-left" style={{ width: 'max-content' }}>
          {doubled.map((crypto, i) => (
            <CryptoBadge key={`${crypto.symbol}-${i}`} {...crypto} />
          ))}
        </div>
      </div>
    </section>
  );
}
