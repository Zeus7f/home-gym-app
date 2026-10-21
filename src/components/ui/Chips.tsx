import React from 'react';
import { cn } from '../../lib/utils';

export interface ChipsProps<T extends string = string> {
  /** آرایه‌ای از تاپل‌های [کلید, عنوان] */
  items: readonly (readonly [T, React.ReactNode])[];
  /** مقدار انتخاب‌شده فعلی */
  value: T;
  /** کالبک تغییر انتخاب */
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Chips — ردیف چیپ‌های فیلتر با قابلیت اسکرول افقی روان.
 *
 * G3: بدون هگز مستقیم — متصل به سیستم توکن‌های طراحی
 * G5: مجهز به نقش‌های معنایی رادیویی جهت دسترسی‌پذیری با صفحه‌کلید و صفحه‌خوان
 */
export function Chips<T extends string = string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: ChipsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5 select-none',
        className
      )}
    >
      {items.map(([k, label]) => {
        const isSelected = value === k;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(k)}
            style={{
              backgroundColor: isSelected ? 'var(--c-ink)' : 'var(--c-surface-1)',
              color: isSelected ? '#ffffff' : 'var(--c-text-muted)',
              borderColor: isSelected ? 'var(--c-ink)' : 'var(--c-border)',
            }}
            className={cn(
              'h-9 px-3.5 rounded-full text-[14px] whitespace-nowrap transition-all duration-150 border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ink)]',
              isSelected
                ? 'font-bold shadow-xs'
                : 'hover:border-[var(--c-border-strong)] hover:text-[var(--c-text)]'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
