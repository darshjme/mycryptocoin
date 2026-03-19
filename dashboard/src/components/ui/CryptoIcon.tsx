'use client';

import React from 'react';
import type { TokenSymbol } from '@mycryptocoin/shared';

/**
 * Accepts any TokenSymbol from the shared package, plus a fallback string
 * for forward-compatibility.
 */
type CryptoSymbol = TokenSymbol | string;

interface CryptoIconProps {
  symbol: CryptoSymbol;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

/**
 * Color map aligned with shared TokenSymbol enum:
 * BTC, ETH, SOL, LTC, USDT, USDC, TRX, BNB
 */
const colorMap: Record<string, { bg: string; text: string; gradient: string }> = {
  BTC: { bg: 'bg-orange-500/15', text: 'text-orange-400', gradient: 'from-orange-500 to-amber-500' },
  ETH: { bg: 'bg-blue-500/15', text: 'text-blue-400', gradient: 'from-blue-500 to-indigo-500' },
  USDT: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
  USDC: { bg: 'bg-blue-500/15', text: 'text-blue-300', gradient: 'from-blue-400 to-cyan-500' },
  BNB: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', gradient: 'from-yellow-500 to-amber-500' },
  SOL: { bg: 'bg-purple-500/15', text: 'text-purple-400', gradient: 'from-purple-500 to-fuchsia-500' },
  TRX: { bg: 'bg-red-500/15', text: 'text-red-400', gradient: 'from-red-500 to-rose-500' },
  LTC: { bg: 'bg-slate-300/15', text: 'text-slate-300', gradient: 'from-slate-300 to-slate-400' },
};

const defaultColor = { bg: 'bg-indigo-500/15', text: 'text-indigo-400', gradient: 'from-indigo-500 to-purple-500' };

const iconPaths: Record<string, React.ReactNode> = {
  BTC: (
    <path
      fill="currentColor"
      d="M12.5 3.5v1.3c1.7.3 3 1.3 3.2 3h-1.8c-.2-1-1-1.6-2.1-1.6-1.3 0-2.1.7-2.1 1.7 0 .9.6 1.3 2.1 1.6 2.2.5 3.5 1.2 3.5 3.1 0 1.7-1.3 2.8-3.2 3.1v1.3h-1.5v-1.3c-1.8-.3-3.2-1.4-3.3-3.2h1.8c.2 1.1 1.1 1.8 2.4 1.8 1.3 0 2.2-.7 2.2-1.8 0-1-.6-1.4-2.2-1.8-2.1-.5-3.4-1.2-3.4-3 0-1.6 1.2-2.7 3-3V3.5h1.4z"
    />
  ),
  ETH: (
    <path
      fill="currentColor"
      d="M12 2L6 12.5l6 3.5 6-3.5L12 2zm0 15l-6-3.5L12 22l6-8.5-6 3.5z"
    />
  ),
  USDT: (
    <path
      fill="currentColor"
      d="M12 4c-1.5 0-4 .5-4 2v1h8V6c0-1.5-2.5-2-4-2zm-5 4v1.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8H7zm5 5c-3.3 0-6-1.3-6-3v7c0 1.7 2.7 3 6 3s6-1.3 6-3v-7c0 1.7-2.7 3-6 3z"
    />
  ),
};

export default function CryptoIcon({ symbol, size = 'md', className = '' }: CryptoIconProps) {
  const colors = colorMap[symbol.toUpperCase()] || defaultColor;
  const sizeClass = sizeMap[size];

  return (
    <div
      className={`
        ${sizeClass} ${colors.bg}
        rounded-full flex items-center justify-center font-bold ${colors.text}
        ring-1 ring-white/5
        ${className}
      `}
    >
      {iconPaths[symbol.toUpperCase()] ? (
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]">
          {iconPaths[symbol.toUpperCase()]}
        </svg>
      ) : (
        <span>{symbol.substring(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

/**
 * Crypto name map aligned with shared SUPPORTED_CRYPTOS constant.
 */
export function CryptoLabel({
  symbol,
  name,
  size = 'md',
}: {
  symbol: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const cryptoNames: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'BNB',
    SOL: 'Solana',
    TRX: 'TRON',
    LTC: 'Litecoin',
  };

  return (
    <div className="flex items-center gap-2.5">
      <CryptoIcon symbol={symbol} size={size} />
      <div>
        <p className="text-sm font-semibold text-white">{symbol.toUpperCase()}</p>
        {(name || cryptoNames[symbol.toUpperCase()]) && (
          <p className="text-xs text-slate-500">{name || cryptoNames[symbol.toUpperCase()]}</p>
        )}
      </div>
    </div>
  );
}
