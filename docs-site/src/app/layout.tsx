import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyCryptoCoin Documentation",
  description:
    "Complete API documentation for MyCryptoCoin crypto payment gateway. Accept BTC, ETH, USDT, and 10+ cryptocurrencies.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-dark-50 font-sans antialiased">
        {/* Fixed top header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-dark-700/50 bg-dark-900/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-6">
            <a href="/docs" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-lg font-bold text-dark-50 group-hover:text-accent-400 transition-colors">
                MyCryptoCoin
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-500/10 text-accent-400 border border-accent-500/20">
                DOCS
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              <a
                href="#merchant-api"
                className="px-3 py-2 text-sm text-dark-300 hover:text-dark-50 transition-colors rounded-lg hover:bg-dark-700/30"
              >
                API Reference
              </a>
              <a
                href="https://mycrypto.co.in/changelog"
                className="px-3 py-2 text-sm text-dark-300 hover:text-dark-50 transition-colors rounded-lg hover:bg-dark-700/30"
              >
                Changelog
              </a>
              <a
                href="https://dashboard.mycrypto.co.in"
                className="px-3 py-2 text-sm text-dark-300 hover:text-dark-50 transition-colors rounded-lg hover:bg-dark-700/30"
              >
                Dashboard
              </a>
              <a
                href="https://mycrypto.co.in"
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 transition-colors rounded-lg"
              >
                Home
              </a>
            </nav>
          </div>
        </header>

        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
