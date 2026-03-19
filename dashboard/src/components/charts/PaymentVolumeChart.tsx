'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const series = [
  {
    name: 'Payments Received',
    type: 'area',
    data: [31, 40, 28, 51, 42, 109, 100, 120, 80, 95, 110, 140],
  },
  {
    name: 'Withdrawals',
    type: 'line',
    data: [11, 32, 45, 32, 34, 52, 41, 60, 45, 55, 70, 90],
  },
];

const options: ApexCharts.ApexOptions = {
  chart: {
    type: 'area',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    foreColor: '#64748b',
    zoom: { enabled: false },
  },
  colors: ['#6366f1', '#8b5cf6'],
  fill: {
    type: ['gradient', 'solid'],
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0.05,
      stops: [0, 95, 100],
    },
  },
  stroke: {
    width: [2, 2],
    curve: 'smooth',
  },
  grid: {
    borderColor: 'rgba(99, 102, 241, 0.06)',
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#64748b', fontSize: '11px' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b', fontSize: '11px' },
      formatter: (val: number) => `$${(val / 1).toFixed(0)}k`,
    },
  },
  tooltip: {
    theme: 'dark',
    x: { show: true },
    y: {
      formatter: (val: number) => `$${val.toLocaleString()}`,
    },
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    labels: { colors: '#94a3b8' },
    markers: { radius: 4 },
  },
};

export default function PaymentVolumeChart() {
  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="area"
        height={350}
      />
    </div>
  );
}
