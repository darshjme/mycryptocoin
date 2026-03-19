'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const series = [
  {
    name: 'Uptime',
    data: [44, 55, 57, 56, 61, 58, 63, 60, 66],
  },
];

const options: ApexCharts.ApexOptions = {
  chart: {
    type: 'bar',
    height: 200,
    toolbar: { show: false },
    background: 'transparent',
    foreColor: '#64748b',
  },
  colors: ['#6366f1'],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '40%',
    },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: 'rgba(99, 102, 241, 0.06)',
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#64748b', fontSize: '10px' } },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b', fontSize: '10px' },
      formatter: (val: number) => `${val}%`,
    },
  },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => `${val}% uptime` },
  },
};

export default function ServerStatusBar() {
  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={200}
    />
  );
}
