'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-xl text-white placeholder-white/30
              bg-white/5 border border-white/10
              outline-none transition-all duration-200
              focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 focus:bg-white/[0.07]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-11' : ''}
              ${iconRight ? 'pr-11' : ''}
              ${error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10' : ''}
              ${className}
            `}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-white/40">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
