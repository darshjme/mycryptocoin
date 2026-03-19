'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
  sparklineData?: number[];
  className?: string;
}

export default function StatCard({
  label,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  iconColor = 'from-brand-600 to-purple-600',
  sparklineData,
  className = '',
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={`glass-card p-6 group hover:border-brand-500/20 transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg`}
        >
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'text-emerald-400 bg-emerald-400/10'
                : isNegative
                ? 'text-rose-400 bg-rose-400/10'
                : 'text-white/40 bg-white/5'
            }`}
          >
            {isPositive && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            )}
            {isNegative && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mb-1">
        <p className="text-2xl font-bold text-white tracking-tight">
          {typeof value === 'number' ? formatValue(value) : value}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{label}</p>
        {change !== undefined && (
          <p className="text-[10px] text-white/25">{changeLabel}</p>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-8">
          <Sparkline data={sparklineData} positive={isPositive || false} />
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const color = positive ? '#34d399' : '#fb7185';
  const colorFaded = positive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGrad-${positive}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorFaded} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${positive})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatValue(num: number): string {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  if (num % 1 !== 0) return `$${num.toFixed(2)}`;
  return num.toLocaleString();
}
