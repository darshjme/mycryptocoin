'use client';

import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  neutral: 'bg-white/8 text-white/60 border-white/10',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-blue-400',
  neutral: 'bg-white/40',
  purple: 'bg-purple-400',
};

export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// Utility function to map status to variant
export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    connected: 'success',
    healthy: 'success',
    completed: 'success',
    confirmed: 'success',
    approved: 'success',
    delivered: 'success',
    read: 'success',
    sent: 'info',
    pending: 'warning',
    pending_approval: 'warning',
    awaiting_payment: 'warning',
    confirming: 'warning',
    processing: 'info',
    connecting: 'warning',
    degraded: 'warning',
    qr_pending: 'warning',
    suspended: 'danger',
    failed: 'danger',
    rejected: 'danger',
    expired: 'danger',
    down: 'danger',
    disconnected: 'danger',
  };
  return map[status] || 'neutral';
}
