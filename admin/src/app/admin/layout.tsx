'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminStore } from '@/stores/adminStore';

const menuItems = [
  {
    title: 'MAIN MENU',
    type: 'section' as const,
  },
  {
    title: 'Dashboard',
    icon: 'grid_view',
    to: '/admin/dashboard',
    type: 'link' as const,
  },
  {
    title: 'Merchants',
    icon: 'store',
    to: '/admin/merchants',
    type: 'link' as const,
  },
  {
    title: 'Transactions',
    icon: 'receipt_long',
    to: '/admin/transactions',
    type: 'link' as const,
  },
  {
    title: 'Payments',
    icon: 'payments',
    to: '/admin/payments',
    type: 'link' as const,
  },
  {
    title: 'Withdrawals',
    icon: 'account_balance',
    to: '/admin/withdrawals',
    type: 'link' as const,
  },
  {
    title: 'Revenue',
    icon: 'trending_up',
    to: '/admin/revenue',
    type: 'link' as const,
  },
  {
    title: 'INTEGRATIONS',
    type: 'section' as const,
  },
  {
    title: 'WhatsApp',
    icon: 'chat',
    to: '/admin/whatsapp',
    type: 'link' as const,
  },
  {
    title: 'OPERATIONS',
    type: 'section' as const,
  },
  {
    title: 'Approvals',
    icon: 'how_to_reg',
    to: '/admin/approvals',
    type: 'link' as const,
  },
  {
    title: 'Reserves',
    icon: 'savings',
    to: '/admin/reserves',
    type: 'link' as const,
  },
  {
    title: 'Compliance',
    icon: 'verified_user',
    to: '/admin/compliance',
    type: 'link' as const,
  },
  {
    title: 'Fraud Alerts',
    icon: 'gpp_bad',
    to: '/admin/fraud',
    type: 'link' as const,
  },
  {
    title: 'SYSTEM',
    type: 'section' as const,
  },
  {
    title: 'Security',
    icon: 'security',
    to: '/admin/security',
    type: 'link' as const,
  },
  {
    title: 'Audit Log',
    icon: 'history',
    to: '/admin/audit',
    type: 'link' as const,
  },
  {
    title: 'Emergency',
    icon: 'emergency',
    to: '/admin/emergency',
    type: 'link' as const,
  },
  {
    title: 'Settings',
    icon: 'settings',
    to: '/admin/settings',
    type: 'link' as const,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, sidebarCollapsed, toggleSidebar, logout: storeLogout } = useAdminStore();
  const [menuToggle, setMenuToggle] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => setHeaderFixed(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = () => {
      setNotifOpen(false);
      setProfileOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    storeLogout();
    router.push('/login');
  };

  const getPageTitle = () => {
    const segment = pathname.split('/').pop() || 'dashboard';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className={`flex min-h-screen ${menuToggle ? 'sidebar-toggled' : ''}`}>
      {/* Sidebar - CryptoZone NavHader + SideBar style */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}
      >
        {/* NavHader - Logo */}
        <div className="flex items-center justify-between h-[70px] px-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
              <span className="material-icons text-lg text-white">currency_bitcoin</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">MyCryptoCoin</h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Panel</span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="material-icons text-lg">{sidebarCollapsed ? 'menu_open' : 'menu'}</span>
          </button>
        </div>

        {/* Sidebar menu - CryptoZone SideBar/MetisMenu style */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.type === 'section') {
                if (sidebarCollapsed) return <li key={index} className="my-4 border-t border-white/5" />;
                return (
                  <li key={index} className="px-3 pt-5 pb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{item.title}</span>
                  </li>
                );
              }
              const isActive = pathname === item.to || (item.to !== '/admin/dashboard' && pathname.startsWith(item.to!));
              return (
                <li key={index}>
                  <Link
                    href={item.to!}
                    className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <span className="material-icons text-xl">{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        {!sidebarCollapsed && (
          <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role || 'super_admin'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]'
        }`}
      >
        {/* Header - CryptoZone Header style */}
        <header
          className={`sticky top-0 z-30 transition-all duration-200 ${headerFixed ? 'backdrop-blur-xl' : ''}`}
          style={{
            background: headerFixed ? 'var(--bg-header)' : 'transparent',
            borderBottom: headerFixed ? '1px solid var(--border-color)' : 'none',
          }}
        >
          <div className="flex items-center justify-between h-[70px] px-6">
            {/* Left - Page title (CryptoZone dashboard_bar style) */}
            <div>
              <h2 className="text-lg font-semibold text-white">{getPageTitle()}</h2>
            </div>

            {/* Right - CryptoZone header-right style */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
                <span className="material-icons text-slate-400 text-lg mr-2">search</span>
                <input
                  type="text"
                  placeholder="Search here..."
                  className="bg-transparent outline-none text-sm text-white placeholder-slate-500 w-44"
                />
              </div>

              {/* Notifications */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  aria-label="Notifications"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span className="material-icons text-xl">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                </button>
                {notifOpen && (
                  <div className="cz-dropdown w-80 right-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="px-4 py-3 border-b border-white/5">
                      <h4 className="text-sm font-semibold text-white">Notifications</h4>
                    </div>
                    <div className="py-2">
                      {[
                        { icon: 'person_add', text: 'New merchant registration: BlockPay Solutions', time: '10 min ago', color: '#3b82f6' },
                        { icon: 'account_balance', text: 'Withdrawal request: 0.15 BTC from CryptoShop Pro', time: '25 min ago', color: '#f59e0b' },
                        { icon: 'check_circle', text: 'Payment confirmed: 0.05 BTC for order #4521', time: '1 hour ago', color: '#10b981' },
                        { icon: 'warning', text: 'SOL blockchain sync degraded', time: '2 hours ago', color: '#f43f5e' },
                      ].map((notif, i) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                          <span className="material-icons text-lg mt-0.5" style={{ color: notif.color }}>{notif.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300">{notif.text}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-white/5">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">See all notifications</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  aria-label="User menu"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                </button>
                {profileOpen && (
                  <div className="cz-dropdown w-48 right-0">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-slate-500">{user?.email || 'admin@mcc.com'}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={handleLogout} className="cz-dropdown-item w-full text-left flex items-center gap-2">
                        <span className="material-icons text-lg text-slate-400">logout</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
