/**
 * src/api/_messages.ts
 * ترجمهٔ پیام‌های لایهٔ استور به زبان فعال.
 *
 * استور فقط کلید پیام برمی‌گرداند (ماژول خالص دامنه)؛ اینجا متن نهایی
 * ساخته می‌شود تا با زبان رابط کاربری هم‌خوان باشد.
 */

import { translations, type Language } from '../lib/i18n';
import { displayName } from '../lib/displayName';
import type {
  StoreMessageKey,
  StoreMessageParams,
  StoreResult,
} from '../lib/domain/storeMessages';

/** زبان فعال — توسط LanguageProvider به‌روزرسانی می‌شود */
let activeLang: Language = 'fa';

export function setApiLocale(lang: Language) {
  activeLang = lang;
}

/** ساخت متن نهایی پیام از روی کلید و پارامترها */
export function translateStoreMessage(
  key: StoreMessageKey,
  params?: StoreMessageParams,
  lang: Language = activeLang
): string {
  const catalog = translations[lang].storeMessages as Record<string, string>;
  const template = catalog[key];
  if (!template) return '';

  let text = template;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      // اعداد و نام افراد هم باید به زبان فعال نمایش داده شوند (ارقام لاتین در انگلیسی).
      const shown =
        typeof value === 'number'
          ? new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(value)
          : displayName(value, lang === 'fa');
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), () => shown);
    }
  }
  return text;
}

/** افزودن متن ترجمه‌شده به نتیجهٔ استور */
export function localizeResult<T extends StoreResult>(result: T, lang: Language = activeLang): T & {
  message: string;
} {
  return {
    ...result,
    message: translateStoreMessage(result.messageKey, result.params, lang),
  };
}
