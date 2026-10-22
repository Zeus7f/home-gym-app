import { useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { AppRole } from './auth/permissions';
import { SECTIONS, resolveSection, sectionPath } from './routes';

/**
 * بخش فعال فضای کاری از مسیر (مثلاً /owner/memberships/abc → memberships + [abc]).
 * پارامتر پیش‌نمایش (preview_role) در همهٔ لینک‌ها حفظ می‌شود.
 *
 * `redirectTo`: وقتی مسیر بخش معتبری ندارد یا آدرس قدیمی `?tab=` دارد، مسیر استاندارد
 * که باید با replace به آن رفت (تا نشانک‌ها و اعلان‌های قدیمی نشکنند).
 */
export function useSection(role: AppRole) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [first, ...sub] = (params['*'] ?? '').split('/').filter(Boolean);
  const search = new URLSearchParams(location.search);
  const legacyTab = search.get('tab');
  const valid = !!first && (SECTIONS[role] as readonly string[]).includes(first);

  const preview = search.get('preview_role');
  const suffix = preview ? `?preview_role=${encodeURIComponent(preview)}` : '';

  const linkTo = useCallback((section: string, ...rest: string[]) => {
    const path = [sectionPath(role, section), ...rest.map(encodeURIComponent)].join('/');
    return `${path}${suffix}`;
  }, [role, suffix]);

  const go = useCallback(
    (raw: string, ...rest: string[]) => navigate(linkTo(resolveSection(role, raw), ...rest)),
    [navigate, linkTo, role]
  );

  const redirectTo = !valid || legacyTab ? linkTo(resolveSection(role, legacyTab ?? first)) : null;

  return { section: valid ? first : resolveSection(role, null), sub, go, linkTo, redirectTo };
}
