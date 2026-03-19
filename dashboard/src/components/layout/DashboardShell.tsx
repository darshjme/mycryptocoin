'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <TopBar />
        <main className="flex-1 p-6 pb-20 lg:pb-6" style={{ minHeight: 'calc(100vh - 70px)' }}>
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
        <footer className="hidden lg:flex items-center justify-between px-6 py-4 border-t border-[rgba(99,102,241,0.08)] text-xs text-slate-600">
          <span>MyCryptoCoin Payment Gateway &copy; {new Date().getFullYear()}</span>
          <span>v2.0.0</span>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}
