'use client';

import React from 'react';

type BadgeVariant =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'processing'
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:
    'bg-red-500/10 text-red-400 border-red-500/20',
  expired:
    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  processing:
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  default:
    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  success:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger:
    'bg-red-500/10 text-red-400 border-red-500/20',
  info:
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-emerald-400',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
  expired: 'bg-slate-400',
  processing: 'bg-blue-400',
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
};

export default function Badge({
  variant = 'default',
  children,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-xs font-semibold rounded-lg border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
            variant === 'processing' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {children}
    </span>
  );
}
