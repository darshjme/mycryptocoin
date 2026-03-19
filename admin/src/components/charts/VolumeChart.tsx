'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface VolumeDataPoint {
  date: string;
  btc: number;
  eth: number;
  usdt: number;
  sol: number;
  total: number;
}

export default function VolumeChart({ data }: { data: VolumeDataPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = data.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'USDT',
            data: data.map((d) => d.usdt / 1000),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'BTC',
            data: data.map((d) => d.btc / 1000),
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'ETH',
            data: data.map((d) => d.eth / 1000),
            backgroundColor: 'rgba(129, 140, 248, 0.7)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'SOL',
            data: data.map((d) => d.sol / 1000),
            backgroundColor: 'rgba(232, 121, 249, 0.7)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'rectRounded',
              padding: 15,
              font: { size: 11, family: 'Manrope' },
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: 'Manrope', size: 12 },
            bodyFont: { family: 'Manrope', size: 11 },
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(1)}K`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11, family: 'Manrope' } },
            border: { display: false },
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#64748b',
              font: { size: 11, family: 'Manrope' },
              callback: (val) => `$${val}K`,
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
    <div className="h-[280px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
