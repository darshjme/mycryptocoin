'use client';

import React, { useState } from 'react';

interface VolumeDataPoint {
  date: string;
  btc: number;
  eth: number;
  usdt: number;
  sol: number;
  total: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  loading?: boolean;
}

const cryptoColors: Record<string, { line: string; fill: string; label: string }> = {
  btc: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)', label: 'Bitcoin' },
  eth: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', label: 'Ethereum' },
  usdt: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', label: 'USDT' },
  sol: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)', label: 'Solana' },
};

export default function VolumeChart({ data, loading }: VolumeChartProps) {
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set(['btc', 'eth', 'usdt', 'sol']));
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (loading || data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Volume by Crypto</h3>
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  const toggleLine = (key: string) => {
    setActiveLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Calculate chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max value across active lines
  let maxVal = 0;
  data.forEach((d) => {
    activeLines.forEach((key) => {
      const val = d[key as keyof VolumeDataPoint] as number;
      if (val > maxVal) maxVal = val;
    });
  });
  maxVal = maxVal * 1.1 || 1;

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * innerWidth;
  const yScale = (val: number) => padding.top + innerHeight - (val / maxVal) * innerHeight;

  const createPath = (key: string): string => {
    const points = data.map((d, i) => {
      const val = d[key as keyof VolumeDataPoint] as number;
      return `${xScale(i)},${yScale(val)}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const createArea = (key: string): string => {
    const line = createPath(key);
    return `${line} L ${xScale(data.length - 1)},${yScale(0)} L ${xScale(0)},${yScale(0)} Z`;
  };

  // Y-axis labels
  const yLabels = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map((v) => ({
    value: v,
    label: v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`,
    y: yScale(v),
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">Volume by Crypto</h3>
        <div className="flex items-center gap-3">
          {Object.entries(cryptoColors).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${
                activeLines.has(key) ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <span className="w-3 h-1 rounded-full" style={{ background: config.line }} />
              <span className="text-white/60">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
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

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(i)}
              y={chartHeight - 5}
              textAnchor="middle"
              className="fill-white/20"
              fontSize="9"
              fontFamily="Manrope"
            >
              {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </text>
          ))}

          {/* Areas & Lines */}
          {Array.from(activeLines).map((key) => (
            <g key={key}>
              <path d={createArea(key)} fill={cryptoColors[key].fill} />
              <path
                d={createPath(key)}
                fill="none"
                stroke={cryptoColors[key].line}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover points */}
          {hoveredPoint !== null &&
            Array.from(activeLines).map((key) => {
              const val = data[hoveredPoint][key as keyof VolumeDataPoint] as number;
              return (
                <circle
                  key={key}
                  cx={xScale(hoveredPoint)}
                  cy={yScale(val)}
                  r="4"
                  fill={cryptoColors[key].line}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}

          {/* Hover areas */}
          {data.map((_, i) => (
            <rect
              key={i}
              x={xScale(i) - innerWidth / data.length / 2}
              y={padding.top}
              width={innerWidth / data.length}
              height={innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute glass-card p-3 pointer-events-none z-10"
            style={{
              left: `${(xScale(hoveredPoint) / chartWidth) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="text-xs text-white/40 mb-1.5">
              {new Date(data[hoveredPoint].date).toLocaleDateString('en', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {Array.from(activeLines).map((key) => {
              const val = data[hoveredPoint][key as keyof VolumeDataPoint] as number;
              return (
                <div key={key} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: cryptoColors[key].line }} />
                    <span className="text-white/60">{cryptoColors[key].label}</span>
                  </div>
                  <span className="text-white font-semibold">${val.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
