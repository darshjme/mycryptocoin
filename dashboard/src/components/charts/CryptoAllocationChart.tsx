'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const series = [40, 20, 15, 10, 15];

const options: ApexCharts.ApexOptions = {
  chart: {
    type: 'donut',
    background: 'transparent',
  },
  labels: ['BTC', 'ETH', 'USDT', 'LTC', 'Other'],
  colors: ['#6366f1', '#8b5cf6', '#c0e192', '#e085e4', '#2a353a'],
  stroke: {
    width: 0,
  },
  plotOptions: {
    pie: {
      donut: {
        size: '75%',
        labels: {
          show: true,
          name: {
            show: true,
            color: '#94a3b8',
            fontSize: '14px',
          },
          value: {
            show: true,
            color: '#e2e8f0',
            fontSize: '20px',
            fontWeight: '700',
            formatter: (val: string) => `$${parseFloat(val).toLocaleString()}`,
          },
          total: {
            show: true,
            label: 'Total Balance',
            color: '#94a3b8',
            fontSize: '13px',
            formatter: () => '$45,892',
          },
        },
      },
    },
  },
  dataLabels: { enabled: false },
  legend: { show: false },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number) => `${val}%`,
    },
  },
};

const legendData = [
  { color: '#6366f1', label: 'BTC (40%)', value: '$18,357' },
  { color: '#8b5cf6', label: 'ETH (20%)', value: '$9,178' },
  { color: '#c0e192', label: 'USDT (15%)', value: '$6,884' },
  { color: '#e085e4', label: 'LTC (10%)', value: '$4,589' },
  { color: '#2a353a', label: 'Other (15%)', value: '$6,884' },
];

export default function CryptoAllocationChart() {
  return (
    <div className="w-full">
      <div className="flex justify-center">
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={250}
          width={250}
        />
      </div>
      <div className="mt-4 space-y-2.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legend</span>
        {legendData.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="text-sm font-semibold text-slate-200">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
