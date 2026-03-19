'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function DoughnutChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['USDT', 'BTC', 'ETH', 'SOL'],
        datasets: [
          {
            data: [45, 25, 20, 10],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(129, 140, 248, 0.8)',
              'rgba(232, 121, 249, 0.8)',
            ],
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
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
            titleFont: { family: 'Manrope', size: 12 },
            bodyFont: { family: 'Manrope', size: 11 },
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
            },
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
  }, []);

  return (
    <div className="h-[180px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
