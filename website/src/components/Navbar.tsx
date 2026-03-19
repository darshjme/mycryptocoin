'use client';

import { useState, useEffect } from 'react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Developers', href: '#developers' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);

    // Detect localhost for demo mode links
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      setIsLocalhost(host === 'localhost' || host === '127.0.0.1');
    }

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loginUrl = isLocalhost ? 'http://localhost:3001/login' : 'https://dashboard.mycrypto.co.in/login';
  const registerUrl = isLocalhost ? 'http://localhost:3001/register' : 'https://dashboard.mycrypto.co.in/register';

  return (
    <>
      {/* Demo mode floating banner — only on localhost */}
      {isLocalhost && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-lg text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-2xl shadow-indigo-500/30 border border-white/10 flex items-center gap-3">
          <span className="text-base">&#128295;</span>
          <span>Demo Mode:</span>
          <a href="http://localhost:3001" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">Dashboard :3001</a>
          <span className="text-white/40">|</span>
          <a href="http://localhost:3002" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">Admin :3002</a>
        </div>
      )}

      <header
        className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20">
                M
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                MyCrypto<span className="text-gradient">Coin</span>
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            {/* Right Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href={loginUrl}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                Login
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href={registerUrl}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              mobileOpen ? 'max-h-[500px] mt-4' : 'max-h-0'
            }`}
          >
            <nav className="flex flex-col gap-1 pb-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 mt-3 px-4">
                <a
                  href={loginUrl}
                  className="flex-1 text-center py-3 rounded-lg text-sm font-medium text-gray-300 border border-white/10 hover:border-white/20 transition-colors"
                >
                  Login
                </a>
                <a
                  href={registerUrl}
                  className="flex-1 text-center py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Get Started
                </a>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
