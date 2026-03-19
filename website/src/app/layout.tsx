import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import '@/styles/globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mycrypto.co.in'),
  title: 'MyCryptoCoin — Accept Crypto Payments Globally | 0.5% Fee',
  description:
    'The simplest way to accept Bitcoin, Ethereum, USDT, and 10+ cryptocurrencies. Just 0.5% per transaction. No hidden fees. Enterprise-grade crypto payment gateway.',
  keywords: [
    'crypto payment gateway',
    'accept bitcoin payments',
    'cryptocurrency payments',
    'bitcoin payment processor',
    'ethereum payments',
    'USDT payment gateway',
    'crypto merchant services',
    'WooCommerce crypto plugin',
    'crypto API',
    'low fee crypto payments',
  ],
  authors: [{ name: 'MyCryptoCoin' }],
  creator: 'MyCryptoCoin',
  publisher: 'MyCryptoCoin',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mycrypto.co.in',
    siteName: 'MyCryptoCoin',
    title: 'MyCryptoCoin — Accept Crypto Payments Globally | 0.5% Fee',
    description:
      'The simplest way to accept Bitcoin, Ethereum, and 10+ cryptocurrencies. Just 0.5% per transaction. No hidden fees.',
    images: [
      {
        url: '/images/home/ogg.png',
        width: 1200,
        height: 630,
        alt: 'MyCryptoCoin — Crypto Payment Gateway',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyCryptoCoin — Accept Crypto Payments Globally | 0.5% Fee',
    description:
      'The simplest way to accept Bitcoin, Ethereum, and 10+ cryptocurrencies. Just 0.5% per transaction.',
    images: ['/images/home/ogg.png'],
    creator: '@mycryptocoin',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/fav-icon/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} scroll-smooth`}>
      <body className="font-sans bg-brand-dark text-slate-200 antialiased">
        {/* Loading Screen */}
        <div id="loader-wrapper">
          <div id="loader" />
        </div>

        {/* Animated Gradient Mesh */}
        <div className="gradient-mesh" aria-hidden="true" />
        {/* Grid Pattern */}
        <div className="grid-pattern" aria-hidden="true" />

        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Loading Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                setTimeout(function() {
                  document.getElementById('loader-wrapper').classList.add('loaded');
                }, 800);
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
