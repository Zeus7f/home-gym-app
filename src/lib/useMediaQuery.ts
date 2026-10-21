/**
 * src/lib/useMediaQuery.ts
 * هوک واکنش‌گرا برای breakpointهای مشترک.
 *
 * B-11: صفحات مالک prop `isMobile` داشتند، اما shell هرگز مقدار آن را تعیین نمی‌کرد؛
 * در نتیجه در عرض ۳۷۵px هم جدول دسکتاپ رندر می‌شد.
 */
import { useEffect, useState } from 'react';

/** با breakpoint `md` در Tailwind (768px) هم‌خوان است. */
export const MOBILE_QUERY = '(max-width: 767px)';

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}

export function useMediaQuery(query: string): boolean {
  const [isMatch, setIsMatch] = useState(() => matches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setIsMatch(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMatch;
}

/** آیا viewport در محدودهٔ موبایل (کمتر از md) است؟ */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
