import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * تب فعال در پارامتر `?tab=` آدرس نگه داشته می‌شود تا با رفرش صفحه و دکمه‌های
 * Back/Forward مرورگر حفظ شود. پارامترهای دیگر (مثل preview_role) دست نمی‌خورند.
 */
export function useTabParam<T extends string>(resolve: (raw: string | null) => T): [T, (key: string) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const active = resolve(new URLSearchParams(location.search).get('tab'));

  const setTab = useCallback(
    (key: string) => {
      const params = new URLSearchParams(location.search);
      const next = resolve(key);
      if (params.get('tab') === next) return;
      params.set('tab', next);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` });
    },
    [location.pathname, location.search, navigate, resolve]
  );

  return [active, setTab];
}
