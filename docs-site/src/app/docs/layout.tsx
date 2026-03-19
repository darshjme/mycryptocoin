"use client";

import { useState } from "react";
import Sidebar from "@/components/docs/Sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/25 flex items-center justify-center transition-colors"
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex-1 lg:ml-[280px]">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:px-12">
          {children}
        </div>
      </div>
    </div>
  );
}
