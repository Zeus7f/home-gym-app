import React from 'react';
import { cn } from '../../lib/utils';
import { useI18n } from '../LanguageProvider';
import { initials } from '../../lib/displayName';

export type AvatarTone = 'mist' | 'ink' | 'brass';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number;
  tone?: AvatarTone;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Avatar — حرف اول نام با پس‌زمینه توکن‌محور
 * G3: بدون hex مستقیم، فقط CSS variables
 */
export function Avatar({
  name,
  size = 40,
  tone = 'mist',
  className,
  style,
  ...props
}: AvatarProps) {
  const { isFa } = useI18n();
  const initial = initials(name, isFa);

  const toneStyle: React.CSSProperties =
    tone === 'ink'
      ? { background: 'var(--c-ink)', color: '#fff' }
      : tone === 'brass'
        ? { background: 'var(--c-brass)', color: 'var(--c-heading)' }
        : { background: 'var(--c-surface-3)', color: 'var(--c-ink)' };

  return (
    <span
      {...props}
      style={{ width: size, height: size, fontSize: size * 0.4, ...toneStyle, ...style }}
      className={cn(
        'shrink-0 rounded-full grid place-items-center font-bold select-none',
        className
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
