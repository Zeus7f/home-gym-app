import React from 'react';
import { cn } from '../../lib/utils';
import { useI18n } from '../LanguageProvider';

export interface SegProps<T extends string = string> {
  /** آرایه‌ای از تاپل‌های [کلید, عنوان] */
  items: readonly (readonly [T, React.ReactNode])[];
  /** مقدار انتخاب‌شده فعلی */
  value: T;
  /** کالبک تغییر انتخاب */
  onChange: (value: T) => void;
  /** عرض کامل */
  full?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Seg — Segmented Control / تب‌های انتخابی فشرده.
 *
 * G3: استایل‌دهی با متغیرهای CSS توکن‌ها
 * G5: مجهز به role="tablist" و role="tab" استاندارد
 */
export function Seg<T extends string = string>({
  items,
  value,
  onChange,
  full = false,
  className,
  ariaLabel,
}: SegProps<T>) {
  const { t } = useI18n();
  const label = ariaLabel ?? t.actions.chooseOption;
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{
        backgroundColor: 'var(--c-surface-2)',
        borderRadius: 'var(--radius-md)',
      }}
      className={cn(
        'flex p-1 gap-1 items-center select-none',
        full ? 'w-full' : 'inline-flex',
        className
      )}
    >
      {items.map(([k, label]) => {
        const isSelected = value === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(k)}
            style={{
              backgroundColor: isSelected ? 'var(--c-surface-1)' : 'transparent',
              color: isSelected ? 'var(--c-deep)' : 'var(--c-text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
            className={cn(
              'px-3.5 h-8 text-[14px] font-medium whitespace-nowrap transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-ink)]',
              isSelected ? 'font-bold shadow-xs' : 'hover:text-[var(--c-text)]',
              full ? 'flex-1 text-center' : ''
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
