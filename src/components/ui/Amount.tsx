/**
 * src/components/ui/Amount.tsx
 * نمایش مبلغ: عدد کامل و سه‌رقمی‌جداشده، با واحد به‌صورت برچسب جدا.
 *
 * جای نمایش خلاصه‌شده (`short`) را می‌گیرد؛ «۸٫۵ م» برای مبلغ خوانا نیست و
 * رقم دقیق را پنهان می‌کند. واحد با اندازهٔ کوچک‌تر کنار عدد می‌نشیند تا
 * عنوان هر بخش بتواند بدون واحد نوشته شود.
 */

import React from 'react';
import { useI18n } from '../LanguageProvider';
import { num } from '../../lib/format';
import { cn } from '../../lib/utils';

export function Amount({
  value,
  unit = true,
  className,
  style,
}: {
  value: number;
  /** نمایش «تومان» کنار عدد */
  unit?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { t } = useI18n();
  return (
    <span className={cn('tnum', className)} style={style} dir="auto">
      {num(value)}
      {unit && (
        <span className="font-sans font-normal text-[0.7em] ms-1" style={{ color: 'var(--c-text-muted)' }}>
          {t.units.toman}
        </span>
      )}
    </span>
  );
}
