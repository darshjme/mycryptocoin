'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminMockMode, ADMIN_USER } from '@/lib/mockData';
import { useAdminStore } from '@/stores/adminStore';

export default function RootPage() {
  const router = useRouter();
  const { login: storeLogin } = useAdminStore();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.replace('/admin/dashboard');
    } else if (isAdminMockMode()) {
      // In demo mode, auto-login and redirect to admin dashboard
      localStorage.setItem('admin_token', 'mock-admin-token-001');
      localStorage.setItem('admin_user', JSON.stringify(ADMIN_USER));
      storeLogin(ADMIN_USER as any, 'mock-admin-token-001');
      router.replace('/admin/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router, storeLogin]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading...</span>
      </div>
    </div>
  );
}
