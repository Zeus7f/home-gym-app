import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { translations, type Language } from '../lib/i18n';
import { setFormatLocale } from '../lib/format';
import { setApiLocale } from '../api/_messages';

export interface LanguageContextValue {
  /** زبان فعال رابط کاربری */
  lang: Language;
  /** تغییر زبان فعال */
  setLang: (lang: Language) => void;
  /** فرهنگ لغت فعال — برای استفاده مستقیم در JSX */
  t: (typeof translations)['fa'];
  /** کمکی: آیا زبان فعال فارسی است؟ */
  isFa: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fa',
  setLang: () => {},
  t: translations.fa,
  isFa: true,
});

/**
 * LanguageProvider — منبع واحد زبان فعال.
 *
 * قبلاً زبان فقط درون App.tsx نگهداری می‌شد و صفحات مربی/ورزشکار به آن
 * دسترسی نداشتند؛ به همین دلیل متن‌های آن‌ها هاردکد فارسی مانده بود.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'fa';
    return (localStorage.getItem('hg_lang') as Language) || 'fa';
  });

  /**
   * محل نمایش اعداد و زبان API باید *پیش از* رندر فرزندان به‌روزرسانی شود،
   * وگرنه در اولین رندر پس از تغییر زبان هنوز ارقام زبان قبلی نمایش داده می‌شود
   * (چون effect پس از رندر اجرا می‌شود).
   */
  setFormatLocale(lang);
  setApiLocale(lang);

  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('hg_lang', lang);
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      t: translations[lang],
      isFa: lang === 'fa',
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** دسترسی به زبان فعال و فرهنگ لغت آن. */
export const useI18n = () => useContext(LanguageContext);
