import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export type BtnVariant = 'primary' | 'ghost' | 'brass' | 'danger' | 'soft';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  v?: BtnVariant;
  children?: React.ReactNode;
}

const VARIANT_STYLES: Record<BtnVariant, { bg: string; fg: string; border?: string; hoverBg?: string }> = {
  primary: {
    bg: 'var(--c-ink)',
    fg: '#ffffff',
    hoverBg: 'var(--c-deep)',
  },
  ghost: {
    bg: 'var(--c-surface-1)',
    fg: 'var(--c-ink)',
    border: 'var(--c-border-strong)',
    hoverBg: 'var(--c-surface-2)',
  },
  brass: {
    bg: 'var(--c-brass)',
    fg: 'var(--c-deep)',
    hoverBg: 'var(--c-brass-hover)',
  },
  danger: {
    bg: 'var(--c-rubber)',
    fg: '#ffffff',
    hoverBg: 'var(--c-rubber-dark)',
  },
  soft: {
    bg: 'var(--c-surface-2)',
    fg: 'var(--c-ink)',
    hoverBg: 'var(--c-surface-3)',
  },
};

/**
 * Btn — دکمه‌های پروتوتایپ با متغیرهای CSS توکن‌ها
 *
 * G3: بدون هگز مستقیم
 */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(
  ({ v = 'primary', className, style, children, type = 'button', ...props }, ref) => {
    const config = VARIANT_STYLES[v];

    return (
      <button
        ref={ref}
        type={type}
        style={{
          backgroundColor: config.bg,
          color: config.fg,
          borderColor: config.border || 'transparent',
          ...style,
        }}
        className={cn(
          'h-10 px-4 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-2 select-none cursor-pointer',
          'transition-all duration-150 whitespace-nowrap active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ink)]',
          config.border ? 'border' : 'border border-transparent',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Btn.displayName = 'Btn';
