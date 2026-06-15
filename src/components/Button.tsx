'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
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
    bg: 'var(--color-paper-2)',
    bgHover: 'var(--color-paper-hover)',
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
    bg: 'var(--color-error-subtle)',
    bgHover: 'var(--color-error-muted)',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error-muted)',
  },
  warning: {
    bg: 'var(--color-warning-subtle)',
    bgHover: 'var(--color-warning-muted)',
    color: 'var(--color-warning)',
    border: '1px solid var(--color-warning-muted)',
  },
};

const SIZES = {
  sm: 'px-3 py-2 text-xs min-h-9',
  md: 'px-4 py-2.5 text-sm min-h-10',
  lg: 'px-5 py-3 text-sm min-h-11',
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-all cursor-pointer whitespace-nowrap shadow-sm
        disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none
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
