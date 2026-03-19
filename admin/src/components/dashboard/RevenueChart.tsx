'use client';

import React, { useState } from 'react';

interface RevenueDataPoint {
  date: string;
  amount: number;
  fees: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (loading || data.length === 0) {
    return (
      <div className="cz-card p-6">
        <h3 className="cz-heading mb-4">Fee Revenue</h3>
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.amount)) * 1.15 || 1;
  const barWidth = Math.max(4, (innerWidth / data.length) * 0.6);
  const barGap = (innerWidth / data.length) * 0.4;

  const totalRevenue = data.reduce((sum, d) => sum + d.amount, 0);
  const avgDaily = totalRevenue / data.length;

  const yScale = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight;

  const yLabels = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map((v) => ({
    value: v,
    label: v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`,
    y: yScale(v),
  }));

  return (
    <div className="cz-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="cz-heading">Fee Revenue</h3>
          <p className="text-sm text-white/40 mt-0.5">
            Total: <span className="text-white font-medium">${totalRevenue.toLocaleString()}</span>
            {' '} | Avg/day: <span className="text-white font-medium">${avgDaily.toFixed(0)}</span>
          </p>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {yLabels.map((label, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={label.y}
                x2={chartWidth - padding.right}
                y2={label.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={label.y + 4}
                textAnchor="end"
                className="fill-white/20"
                fontSize="9"
                fontFamily="Manrope"
              >
                {label.label}
              </text>
            </g>
          ))}

          {/* Average line */}
          <line
            x1={padding.left}
            y1={yScale(avgDaily)}
            x2={chartWidth - padding.right}
            y2={yScale(avgDaily)}
            stroke="rgba(99, 102, 241, 0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Bars */}
          {data.map((d, i) => {
            const x = padding.left + i * (innerWidth / data.length) + barGap / 2;
            const barHeight = (d.amount / maxVal) * innerHeight;
            const y = padding.top + innerHeight - barHeight;
            const isHovered = hoveredBar === i;

            return (
              <g key={i}>
                <defs>
                  <linearGradient id={`barGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isHovered ? '#818cf8' : '#6366f1'} stopOpacity={isHovered ? 0.9 : 0.6} />
                    <stop offset="100%" stopColor={isHovered ? '#4f46e5' : '#4338ca'} stopOpacity={isHovered ? 0.7 : 0.3} />
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#barGrad-${i})`}
                  rx="2"
                  className="transition-all duration-150"
                />
                {/* Hover area */}
                <rect
                  x={x - barGap / 2}
                  y={padding.top}
                  width={barWidth + barGap}
                  height={innerHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                {/* X-axis labels - show every 5th */}
                {(i % 5 === 0 || i === data.length - 1) && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    className="fill-white/20"
                    fontSize="8"
                    fontFamily="Manrope"
                  >
                    {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBar !== null && (
          <div
            className="absolute cz-card p-3 pointer-events-none z-10"
            style={{
              left: `${((padding.left + hoveredBar * (innerWidth / data.length) + barWidth / 2) / chartWidth) * 100}%`,
              top: '5px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs text-white/40 mb-1">
              {new Date(data[hoveredBar].date).toLocaleDateString('en', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm font-semibold text-white">${data[hoveredBar].amount.toLocaleString()}</p>
            <p className="text-xs text-white/40">Fees: ${data[hoveredBar].fees.toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
