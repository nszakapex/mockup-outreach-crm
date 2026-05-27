'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const VARIANTS = {
  primary: {
    bg: 'var(--color-accent)',
    bgHover: 'var(--color-accent-hover)',
    color: 'var(--color-paper)',
    border: 'none',
  },
  secondary: {
    bg: 'var(--color-paper-3)',
    bgHover: 'var(--color-paper-4)',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    bg: 'transparent',
    bgHover: 'var(--color-paper-3)',
    color: 'var(--color-ink-2)',
    border: 'none',
  },
  danger: {
    bg: 'oklch(65% 0.22 25 / 0.12)',
    bgHover: 'oklch(65% 0.22 25 / 0.2)',
    color: 'var(--color-error)',
    border: '1px solid oklch(65% 0.22 25 / 0.2)',
  },
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const v = VARIANTS[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all cursor-pointer whitespace-nowrap
        disabled:opacity-40 disabled:cursor-not-allowed
        ${SIZES[size]} ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: v.border,
      }}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = v.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = v.bg;
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
