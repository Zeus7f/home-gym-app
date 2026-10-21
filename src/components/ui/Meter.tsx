import React from 'react';
import { cn } from '../../lib/utils';
import { fa } from '../../lib/format';

export interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** تعداد کل جلسات پکیج */
  total: number;
  /** تعداد جلسات مصرف‌شده */
  used: number;
  /** ارتفاع هر تیک به پیکسل (پیش‌فرض: ۸) */
  h?: number;
  className?: string;
}

/**
 * Meter — نوار وضعیت تیک‌خورده جلسات باقیمانده پکیج.
 *
 * G3: بدون هگز مستقیم — استفاده از متغیرهای CSS توکن‌ها
 * G5: دارای مشخصه‌های معنایی ARIA جهت دسترسی‌پذیری کامل
 */
export function Meter({
  total,
  used,
  h = 8,
  className,
  ...props
}: MeterProps) {
  // بدون بسته (مثلاً ورزشکارِ منتظر تعیین بسته): فقط ریل خالی
  if (!(total > 0)) {
    return (
      <div className={cn('w-full rounded-[2px]', className)} style={{ height: h, backgroundColor: 'var(--c-border)' }} aria-hidden="true" {...props} />
    );
  }
  const safeTotal = Math.max(1, total);
  const remaining = Math.max(0, safeTotal - used);
  const isLow = remaining <= 2 && remaining > 0;

  return (
    <div
      role="meter"
      aria-valuenow={remaining}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-label={`${fa(remaining)} جلسه باقیمانده از مجموع ${fa(safeTotal)} جلسه`}
      className={cn('flex gap-[2px] items-center w-full', className)}
      {...props}
    >
      {Array.from({ length: safeTotal }, (_, i) => {
        // تیک‌های مصرف‌شده بعد از ایندکس باقیمانده قرار می‌گیرند
        const isConsumed = i >= remaining;
        const tickColor = isConsumed
          ? 'var(--c-border)'
          : isLow
            ? 'var(--c-rubber)'
            : 'var(--c-ink)';

        return (
          <span
            key={i}
            style={{
              height: h,
              backgroundColor: tickColor,
            }}
            className="flex-1 rounded-[2px] transition-colors duration-200"
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
