'use client';

import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: 'glass-card',
  glass:
    'bg-gradient-to-br from-[rgba(26,29,46,0.8)] to-[rgba(15,17,23,0.6)] backdrop-blur-xl border border-[rgba(99,102,241,0.12)] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl',
  flat: 'bg-[#1a1d2e] border border-[rgba(99,102,241,0.1)] rounded-2xl',
};

export default function Card({
  variant = 'default',
  padding = 'md',
  hover = true,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${
          hover
            ? 'transition-all duration-300 hover:border-indigo-500/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5'
            : ''
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
