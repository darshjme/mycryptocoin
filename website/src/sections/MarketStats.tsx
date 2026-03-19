'use client';

const stats = [
  {
    value: '500+',
    label: 'Merchants',
    change: '+12.5',
    up: true,
  },
  {
    value: '$50M+',
    label: 'Processed',
    change: '+24.3',
    up: true,
  },
  {
    value: '10+',
    label: 'Cryptos',
    change: '+2',
    up: true,
  },
  {
    value: '0.5%',
    label: 'Fee',
    change: '-0.00',
    up: false,
  },
];

export default function MarketStats() {
  return (
    <section className="relative -mt-4 mb-16 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-strong rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
                <div
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    stat.up ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  {stat.up ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14l5-5 5 5H7z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5H7z" />
                    </svg>
                  )}
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
