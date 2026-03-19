'use client';
import DashboardShell from '@/components/layout/DashboardShell';
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
