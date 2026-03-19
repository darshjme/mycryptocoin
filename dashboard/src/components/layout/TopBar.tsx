'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { useRouter, usePathname } from 'next/navigation';

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Derive page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
  };

  return (
    <header className={`h-[70px] border-b border-[rgba(99,102,241,0.08)] bg-[#0c0f1a]/80 backdrop-blur-xl sticky top-0 z-40`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Page Title */}
        <div className="header-left">
          <h2 className="text-lg font-bold text-white capitalize">{getPageTitle()}</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-[#1a1d2e]/50 border border-transparent rounded-xl pl-10 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/30 focus:bg-[#1a1d2e]/80 transition-all"
            />
          </div>

          {/* Settings dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Settings"
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M20.4 13.48c.36.18.64.46.83.74.38.58.35 1.29-.02 1.92l-.71 1.12c-.38.6-1.09.97-1.81.97-.36 0-.76-.1-1.09-.28-.27-.16-.57-.22-.9-.22-1.01 0-1.86.78-1.89 1.7 0 1.08-.94 1.92-2.12 1.92h-1.39c-1.19 0-2.12-.84-2.12-1.92-.03-.92-.88-1.7-1.89-1.7-.33 0-.64.06-.9.22-.33.19-.72.28-1.08.28-.73 0-1.44-.37-1.82-.97L2.79 16.14c-.38-.61-.4-1.34-.02-1.92.16-.28.47-.56.82-.74.29-.13.47-.35.64-.6.51-.81.2-1.86-.65-2.34C2.56 10.01 2.23 8.82 2.81 7.89l.69-1.11c.59-.93 1.86-1.26 2.88-.73.89.45 2.04.15 2.56-.66.16-.26.26-.55.24-.83-.02-.37.09-.71.29-.99.38-.58 1.06-.95 1.81-.97h1.44c.76 0 1.44.37 1.82.97.19.28.32.62.29.99-.03.28.07.57.24.83.52.81 1.68 1.11 2.56.66 1.02-.52 2.29-.19 2.88.74l.68 1.1c.59.93.27 2.12-.76 2.65-.87.48-1.18 1.53-.66 2.34.17.25.36.47.64.6zM9.11 12.01a2.89 2.89 0 002.9 2.64 2.89 2.89 0 002.87-2.64 2.89 2.89 0 00-2.87-2.65 2.89 2.89 0 00-2.9 2.65z" />
              </svg>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#1a1d2e] border border-[rgba(99,102,241,0.15)] rounded-xl shadow-xl shadow-black/30 overflow-hidden scale-in max-h-[400px] overflow-y-auto">
                <h4 className="text-center border-b border-[rgba(99,102,241,0.1)] py-3 text-sm font-semibold text-white">Notifications</h4>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n: Notification) => (
                    <button
                      key={n.id}
                      onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                      className="w-full text-left px-4 py-3 border-b border-[rgba(99,102,241,0.05)] hover:bg-white/[0.02] transition-colors"
                    >
                      <p className="text-sm text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Notification bell */}
          <button aria-label="Notifications" className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 23">
              <path fillRule="evenodd" clipRule="evenodd" d="M18.71 8.56c0 1.18.33 1.87 1.06 2.67.55.59.73 1.35.73 2.17 0 .82-.29 1.6-.86 2.23-.75.76-1.82 1.24-2.9 1.32-1.57.13-3.14.23-4.74.23-1.59 0-3.17-.06-4.74-.23-1.08-.08-2.15-.56-2.9-1.32-.56-.63-.86-1.41-.86-2.23 0-.82.18-1.58.73-2.17.76-.8 1.07-1.49 1.07-2.67v-.4c0-1.58.42-2.6 1.28-3.61 1.29-1.47 3.35-2.36 5.38-2.36h.09c2.08 0 4.2.92 5.47 2.46.82.99 1.2 1.98 1.2 3.51v.4zM9.07 19.11c0-.47.46-.69.89-.78.5-.1 3.55-.1 4.05 0 .43.09.9.31.9.78-.03.45-.31.85-.7 1.1-.5.37-1.09.6-1.71.69-.34.04-.69.04-1.02 0-.62-.09-1.19-.32-1.7-.69-.39-.25-.67-.65-.7-1.1z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              aria-label="User menu"
              className="flex items-center"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                {user?.businessName?.charAt(0) || 'M'}
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1a1d2e] border border-[rgba(99,102,241,0.15)] rounded-xl shadow-xl shadow-black/30 overflow-hidden scale-in">
                <div className="py-1">
                  <button
                    onClick={() => { router.push('/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button
                    onClick={() => { router.push('/integration'); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Integration
                  </button>
                  <hr className="my-1 border-[rgba(99,102,241,0.08)]" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
