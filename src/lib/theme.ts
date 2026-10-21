/**
 * src/lib/theme.ts
 * منبع واحد theme برنامه.
 *
 * B-10: قبلاً دو نویسنده (ThemeToggle و تنظیمات مالک) جداگانه `data-theme` را عوض می‌کردند،
 * در حالی که utilityهای `dark:` در Tailwind از تنظیم سیستم‌عامل پیروی می‌کردند.
 * اکنون:
 *   - انتخاب صریح Light/Dark بر تنظیم سیستم غالب است؛ System از سیستم‌عامل پیروی می‌کند.
 *   - `data-theme` همیشه `light` یا `dark` است و variant `dark:` به همان وصل است (index.css).
 *   - همهٔ کنترل‌ها از طریق رویداد مشترک هم‌گام می‌مانند.
 */
import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'hg_theme';
const CHANGE_EVENT = 'hg-theme-change';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isPreference(v: unknown): v is ThemePreference {
  return v === 'light' || v === 'dark' || v === 'system';
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

/** theme مؤثر پس از اعمال تنظیم سیستم */
export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

/** اعمال theme روی ریشهٔ سند (بدون ذخیره). */
export function applyTheme(pref: ThemePreference = getThemePreference()) {
  if (typeof document === 'undefined') return;
  const effective = resolveTheme(pref);
  const root = document.documentElement;
  root.setAttribute('data-theme', effective);
  root.style.colorScheme = effective;
}

/** ذخیره، اعمال و اطلاع‌رسانی به همهٔ کنترل‌های theme. */
export function setThemePreference(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ذخیره‌سازی در دسترس نیست؛ theme فقط برای همین نشست اعمال می‌شود.
  }
  applyTheme(pref);
  window.dispatchEvent(new CustomEvent<ThemePreference>(CHANGE_EVENT, { detail: pref }));
}

/** هوک مشترک برای کنترل‌های theme. */
export function useThemePreference(): [ThemePreference, (pref: ThemePreference) => void] {
  const [pref, setPref] = useState<ThemePreference>(getThemePreference);

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ThemePreference>).detail;
      setPref(isPreference(next) ? next : getThemePreference());
    };
    window.addEventListener(CHANGE_EVENT, onChange);

    // در حالت System، تغییر تنظیم سیستم‌عامل باید بلافاصله اعمال شود.
    const mql = window.matchMedia?.(DARK_QUERY);
    const onSystemChange = () => {
      if (getThemePreference() === 'system') applyTheme('system');
    };
    mql?.addEventListener('change', onSystemChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      mql?.removeEventListener('change', onSystemChange);
    };
  }, []);

  return [pref, setThemePreference];
}
