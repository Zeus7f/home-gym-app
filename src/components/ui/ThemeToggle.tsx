import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemePreference, type ThemePreference } from '../../lib/theme';
import { useI18n } from '../LanguageProvider';

/** @deprecated از `ThemePreference` در `lib/theme` استفاده کنید. */
export type Theme = ThemePreference;

const OPTIONS: { value: ThemePreference; icon: React.ElementType }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
];

/**
 * ThemeToggle — انتخاب Light / Dark / System.
 * B-10: وضعیت از منبع واحد `lib/theme` خوانده می‌شود تا با تنظیمات مالک هم‌گام بماند.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useThemePreference();
  const { t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.owner.settings.theme}
      className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const label = t.theme[value];
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={`p-1.5 rounded-lg transition-colors ${
              active
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
