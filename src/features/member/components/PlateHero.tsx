import React from 'react';
import { motion } from 'motion/react';
import { num } from '../../../lib/format';
import { useI18n } from '../../../components/LanguageProvider';
import { cn } from '../../../lib/utils';

export interface PlateHeroProps {
  /** تعداد کل جلسات بسته */
  total: number;
  /** تعداد جلسات باقیمانده */
  remaining: number;
  /** ارتفاع هر صفحه/ستون به پیکسل (پیش‌فرض: ۷۸) */
  height?: number;
  /** عرض هر صفحه به پیکسل (پیش‌فرض: ۸) */
  plateWidth?: number;
  className?: string;
}

/**
 * PlateHero — نمایش گرافیکی صفحات وزنه/جلسات باقیمانده بسته تمرینی
 *
 * G3: استایل‌دهی بر مبنای توکن‌های طراحی
 * G5: دارای نقش معنایی meter و برچسب دسترس‌پذیری کامل
 */
export function PlateHero({
  total = 12,
  remaining = 4,
  height = 78,
  plateWidth = 8,
  className,
}: PlateHeroProps) {
  const { t } = useI18n();
  const safeTotal = Math.max(1, total);
  const safeRemaining = Math.max(0, Math.min(safeTotal, remaining));
  const isLow = safeRemaining <= 2 && safeRemaining > 0;

  return (
    <div
      role="meter"
      aria-valuenow={safeRemaining}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-label={t.member.home.remainingLabel + ': ' + num(safeRemaining) + ' / ' + num(safeTotal)}
      className={cn('flex gap-[3px] items-end select-none', className)}
    >
      {Array.from({ length: safeTotal }, (_, i) => {
        const isActive = i < safeRemaining;
        const plateColor = isActive
          ? isLow
            ? 'var(--c-rubber)'
            : 'var(--c-brass)'
          : 'var(--c-deep)';

        return (
          <motion.span
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{
              delay: 0.08 + i * 0.035,
              duration: 0.45,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              width: plateWidth,
              height: height,
              backgroundColor: plateColor,
              transformOrigin: 'bottom',
            }}
            className="rounded-[2px] transition-colors"
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
