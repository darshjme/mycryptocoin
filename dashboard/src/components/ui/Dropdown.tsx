'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  className = '',
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={ref}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between gap-2
            bg-[#1a1d2e]/80 border rounded-xl px-4 py-2.5
            text-sm transition-all duration-200
            hover:border-slate-500/50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500/50'
                : isOpen
                ? 'border-indigo-500/50 ring-2 ring-indigo-500/40'
                : 'border-[rgba(99,102,241,0.15)]'
            }
          `}
        >
          <span className={`flex items-center gap-2 ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
            {selected?.icon}
            {selected?.label || placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1d2e] border border-[rgba(99,102,241,0.2)] rounded-xl shadow-xl shadow-black/30 overflow-hidden scale-in">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                    transition-colors duration-100
                    ${
                      option.value === value
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  {option.icon}
                  {option.label}
                  {option.value === value && (
                    <svg className="w-4 h-4 ml-auto text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
