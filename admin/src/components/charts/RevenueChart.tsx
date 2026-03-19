'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface RevenueDataPoint {
  date: string;
  amount: number;
  fees: number;
}

export default function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    const labels = data.map((d) => {
      const date = new Date(d.date);
      return date.getDate().toString();
    });

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: data.map((d) => d.fees),
            borderColor: '#6366f1',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#6366f1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Manrope', size: 11 },
            bodyFont: { family: 'Manrope', size: 11 },
            callbacks: {
              label: (ctx) => `Fees: $${ctx.parsed.y.toFixed(0)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10, family: 'Manrope' }, maxTicksLimit: 10 },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#64748b',
              font: { size: 10, family: 'Manrope' },
              callback: (val) => `$${val}`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  return (
    <div className="h-[200px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
