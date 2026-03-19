'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isMockMode, DEMO_USER } from '@/lib/mockData';

export default function HomePage() {
  const router = useRouter();
  const { token, user, login } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      router.replace('/dashboard');
    } else if (isMockMode()) {
      // In demo mode, auto-login and redirect to dashboard
      login(
        {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          role: DEMO_USER.role as any,
          businessName: DEMO_USER.businessName,
          businessUrl: DEMO_USER.businessUrl || undefined,
          logoUrl: DEMO_USER.logoUrl || undefined,
          isEmailVerified: DEMO_USER.isEmailVerified,
          twoFactorEnabled: DEMO_USER.twoFactorEnabled,
          kycStatus: DEMO_USER.kycStatus as any,
          lastLoginAt: DEMO_USER.lastLoginAt,
          createdAt: DEMO_USER.createdAt,
        },
        'mock-access-token-demo-001',
        'mock-refresh-token-demo-001'
      );
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, user, router, login]);

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading MyCryptoCoin...</p>
      </div>
    </div>
  );
}
