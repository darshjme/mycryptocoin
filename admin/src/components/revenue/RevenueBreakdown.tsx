'use client';

import React, { useState } from 'react';

interface CryptoRevenue {
  crypto: string;
  amount: number;
  percentage: number;
}

interface RevenueBreakdownProps {
  data: CryptoRevenue[];
  totalRevenue: number;
  loading?: boolean;
}

const cryptoConfig: Record<string, { color: string; bgColor: string }> = {
  BTC: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  ETH: { color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  USDT: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  SOL: { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  Other: { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.15)' },
};

export default function RevenueBreakdown({ data, totalRevenue, loading }: RevenueBreakdownProps) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="cz-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue by Crypto</h3>
        <div className="flex items-center gap-8">
          <div className="w-48 h-48 rounded-full bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Pie chart calculations
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const innerRadius = 45;

  let currentAngle = -90; // Start from top
  const slices = data.map((item) => {
    const startAngle = currentAngle;
    const sliceAngle = (item.percentage / 100) * 360;
    currentAngle += sliceAngle;
    return {
      ...item,
      startAngle,
      endAngle: startAngle + sliceAngle,
      midAngle: startAngle + sliceAngle / 2,
    };
  });

  const polarToCartesian = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    const start1 = polarToCartesian(startAngle, outerR);
    const end1 = polarToCartesian(endAngle, outerR);
    const start2 = polarToCartesian(endAngle, innerR);
    const end2 = polarToCartesian(startAngle, innerR);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start1.x} ${start1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
      `L ${start2.x} ${start2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <div className="cz-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Revenue by Crypto</h3>

      <div className="flex items-center gap-8 flex-col sm:flex-row">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice, i) => {
              const config = cryptoConfig[slice.crypto] || cryptoConfig.Other;
              const isHovered = hoveredSlice === i;
              const outerR = isHovered ? radius + 4 : radius;
              const innerR = isHovered ? innerRadius - 2 : innerRadius;

              return (
                <path
                  key={slice.crypto}
                  d={createArcPath(slice.startAngle, slice.endAngle, outerR, innerR)}
                  fill={config.color}
                  opacity={hoveredSlice !== null && !isHovered ? 0.3 : 0.8}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice(i)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hoveredSlice !== null ? (
              <>
                <span className="text-lg font-bold text-white">
                  {slices[hoveredSlice].percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-white/40">{slices[hoveredSlice].crypto}</span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-white">
                  ${totalRevenue >= 1000 ? `${(totalRevenue / 1000).toFixed(1)}K` : totalRevenue.toFixed(0)}
                </span>
                <span className="text-xs text-white/40">Total</span>
              </>
            )}
          </div>
        </div>

        {/* Legend & Data */}
        <div className="flex-1 space-y-3 w-full">
          {data.map((item, i) => {
            const config = cryptoConfig[item.crypto] || cryptoConfig.Other;
            return (
              <div
                key={item.crypto}
                className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  hoveredSlice === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: config.bgColor, color: config.color }}
                  >
                    {item.crypto}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.crypto}</p>
                    <p className="text-xs text-white/30">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${item.amount.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
