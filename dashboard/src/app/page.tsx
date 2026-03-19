'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, user, router]);

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading MyCryptoCoin...</p>
      </div>
    </div>
  );
}
