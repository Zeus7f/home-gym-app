/**
 * src/lib/i18n/index.ts
 * Bilingual dictionary (English & Persian) for the whole platform.
 *
 * Each area lives in its own module so no single file grows unmanageable:
 *   app      — brand, roles, navigation, interactive tour
 *   common   — units, session statuses, generic actions, notification copy
 *   trainer  — trainer workspace
 *   member   — member (athlete) workspace
 *   owner    — owner (gym manager) workspace
 *   calendar — shared month calendar
 */

import { appDict } from './app';
import { commonDict } from './common';
import { trainerDict } from './trainer';
import { memberDict } from './member';
import { ownerDict } from './owner';
import { calendarDict } from './calendar';
import { accountsDict } from './accounts';

export type Language = 'en' | 'fa';

export const translations = {
  en: {
    // برچسب‌های عمومی و پوستهٔ اپ (نقش‌ها، ناوبری، راهنمای تعاملی، ورود)
    ...appDict.en,
    // واحدها، وضعیت جلسات، کنش‌های عمومی و متن اعلان‌ها
    ...commonDict.en,
    // متن تقویم ماهانه
    ...calendarDict.en,
    // پوستهٔ واحد، صفحهٔ ورود، پنل مدیر کل و فرم‌های حساب
    ...accountsDict.en,
    // فضای کاری هر نقش — با فضای‌نام تا دسترسی صریح باشد: t.trainer.* / t.member.* / t.owner.*
    trainer: trainerDict.en,
    member: memberDict.en,
    owner: ownerDict.en,
  },
  fa: {
    ...appDict.fa,
    ...commonDict.fa,
    ...calendarDict.fa,
    ...accountsDict.fa,
    trainer: trainerDict.fa,
    member: memberDict.fa,
    owner: ownerDict.fa,
  },
};

export type Dictionary = (typeof translations)['fa'];

export {
  PERSIAN_MONTH_NAMES_EN,
  PERSIAN_WEEK_DAYS_SHORT_EN,
  PERSIAN_WEEK_DAYS_EN,
} from '../date/jalali';
