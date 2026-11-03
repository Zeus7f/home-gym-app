/**
 * src/features/accounts/presets.ts
 * فهرست‌های از پیش تعریف‌شدهٔ فرم‌های ساخت حساب.
 *
 * برچسب‌ها به شکل «فارسی (English)» ذخیره می‌شوند تا `localizedLabel` بتواند
 * در رابط انگلیسی بخش لاتین را نشان دهد؛ همان قالبی که دادهٔ نمونه دارد.
 */

/** تخصص‌های قابل انتخاب مربی — جای ورود متن آزاد را می‌گیرد. */
export const TRAINER_SPECIALTIES: string[] = [
  'قدرتی و فرم‌دهی (Strength & Hypertrophy)',
  'بدنسازی حرفه‌ای (Bodybuilding)',
  'پاورلیفتینگ (Powerlifting)',
  'کاهش وزن و چربی‌سوزی (Weight Loss)',
  'کاردیو و آمادگی جسمانی (Cardio & Conditioning)',
  'کراس‌فیت و فانکشنال (CrossFit & Functional)',
  'تی‌آر‌ایکس و وزن بدن (TRX & Bodyweight)',
  'حرکات اصلاحی و بازتوانی (Corrective & Rehab)',
  'آمادگی ورزشی و قدرت تخصصی (Athletic Performance)',
  'یوگا و تحرک‌پذیری (Yoga & Mobility)',
  'پیلاتس (Pilates)',
  'تناسب اندام بانوان (Women’s Fitness)',
  'تمرین سالمندان (Senior Fitness)',
  'تغذیه و ترکیب بدن (Nutrition & Body Composition)',
];

export interface PackagePreset {
  /** شناسهٔ گزینه در فهرست کشویی */
  id: string;
  /** نامی که روی پروندهٔ ورزشکار می‌نشیند */
  label: string;
  /** تعداد جلسه‌های بسته */
  sessions: number;
  /** طول اعتبار بسته به روز — تاریخ انقضا از همین ساخته می‌شود */
  days: number;
}

/**
 * بسته‌های رایج باشگاه: تعداد جلسه در یک بازهٔ زمانی مشخص.
 * انتخاب هر گزینه تعداد جلسات و تاریخ انقضا را پر می‌کند؛ مبلغ را مدیر وارد می‌کند.
 */
export const PACKAGE_PRESETS: PackagePreset[] = [
  { id: '8-1m', label: 'بستهٔ ۸ جلسه‌ای یک ماهه (8 sessions / 1 month)', sessions: 8, days: 30 },
  { id: '12-1m', label: 'بستهٔ ۱۲ جلسه‌ای یک ماهه (12 sessions / 1 month)', sessions: 12, days: 30 },
  { id: '12-2m', label: 'بستهٔ ۱۲ جلسه‌ای دو ماهه (12 sessions / 2 months)', sessions: 12, days: 60 },
  { id: '16-2m', label: 'بستهٔ ۱۶ جلسه‌ای دو ماهه (16 sessions / 2 months)', sessions: 16, days: 60 },
  { id: '20-3m', label: 'بستهٔ ۲۰ جلسه‌ای سه ماهه (20 sessions / 3 months)', sessions: 20, days: 90 },
  { id: '24-3m', label: 'بستهٔ ۲۴ جلسه‌ای سه ماهه (24 sessions / 3 months)', sessions: 24, days: 90 },
  { id: '36-6m', label: 'بستهٔ ۳۶ جلسه‌ای شش ماهه (36 sessions / 6 months)', sessions: 36, days: 180 },
];

/** شناسهٔ گزینهٔ «بستهٔ سفارشی» — تعداد جلسه، نام و تاریخ را خود کاربر وارد می‌کند. */
export const CUSTOM_PACKAGE_ID = 'custom';
