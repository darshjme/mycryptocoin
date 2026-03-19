'use client';

import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubMenuItem {
  title: string;
  to: string;
}

interface MenuItem {
  title: string;
  iconPath: string;
  to?: string;
  children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    to: '/dashboard',
  },
  {
    title: 'Payments',
    iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    to: '/payments',
  },
  {
    title: 'Wallets',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    to: '/wallets',
  },
  {
    title: 'Transactions',
    iconPath: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
    to: '/transactions',
  },
  {
    title: 'Withdrawals',
    iconPath: 'M12 19V5m0 0l-7 7m7-7l7 7',
    to: '/withdrawals',
  },
  {
    title: 'Reports',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    to: '/reports',
  },
  {
    title: 'Integration',
    iconPath: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    children: [
      { title: 'API Keys', to: '/integration' },
      { title: 'Webhooks', to: '/integration/webhooks' },
      { title: 'SDK Examples', to: '/integration/sdk' },
    ],
  },
  {
    title: 'Settings',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    to: '/settings',
  },
  {
    title: 'Activity',
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    to: '/activity',
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (to?: string) => {
    if (!to) return false;
    if (to === '/dashboard') return pathname === '/dashboard';
    return pathname === to || pathname.startsWith(to + '/');
  };

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen sticky top-0
        bg-[#0c0f1a] border-r border-[rgba(99,102,241,0.08)]
        transition-all duration-300 ease-out flex-shrink-0
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* Logo / Brand */}
      <div className="h-[70px] flex items-center gap-3 px-5 border-b border-[rgba(99,102,241,0.08)]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-sm">MC</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">MyCryptoCoin</span>
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Merchant Portal</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const active = isActive(item.to);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.title);
            const childActive = item.children?.some((c) => isActive(c.to));

            return (
              <Fragment key={item.title}>
                {hasChildren ? (
                  <li>
                    <button
                      onClick={() => toggleExpand(item.title)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all duration-200 group relative
                        ${
                          childActive
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }
                      `}
                      title={collapsed ? item.title : undefined}
                    >
                      <span className="flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.iconPath} />
                        </svg>
                      </span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          <svg
                            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <ul className="mt-1 ml-9 flex flex-col gap-0.5 fade-in">
                        {item.children!.map((child) => (
                          <li key={child.to}>
                            <Link
                              href={child.to}
                              className={`
                                block px-3 py-2 rounded-lg text-sm transition-colors
                                ${
                                  isActive(child.to)
                                    ? 'text-indigo-400 bg-indigo-500/5'
                                    : 'text-slate-500 hover:text-slate-200'
                                }
                              `}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li>
                    <Link
                      href={item.to!}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all duration-200 relative group
                        ${
                          active
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                        }
                      `}
                      title={collapsed ? item.title : undefined}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                      )}
                      <span className={`flex-shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.iconPath} />
                        </svg>
                      </span>
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[rgba(99,102,241,0.08)]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-all text-xs"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
