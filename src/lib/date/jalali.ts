// Standalone High-Precision Jalali (Solar Hijri) Date Utility
// Accurate conversion between Gregorian and Solar Hijri (Persian) calendars

export interface JalaliDate {
  jy: number; // Jalali year (e.g. 1403)
  jm: number; // Jalali month (1-12)
  jd: number; // Jalali day (1-31)
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
];

export const PERSIAN_WEEK_DAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Check if a Jalali year is leap year (کبیسه)
export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
    2456, 3178
  ];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) return false;

  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) / 33) * 33;
  let leap = ((((n + 1) % 33) - 1) % 4);
  if (leap === -1) leap = 4;
  return leap === 0;
}

// Number of days in a Jalali month
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

// Gregorian to Jalali conversion algorithm
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    (365 * gy) +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd;

  for (let i = 0; i < gm; ++i) days += g_d_m[i];

  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { jy, jm, jd };
}

// Jalali to Gregorian conversion algorithm
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  let jy2 = jy - 979;
  let days =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;

  let flag = true;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
    else flag = false;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days >= 366) {
    flag = false;
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }

  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= g_d_m[gm]) {
    days -= g_d_m[gm];
    gm++;
  }
  let gd = days + 1;

  return { gy, gm, gd };
}

// Get day of week index for Jalali date (0 = Saturday, 6 = Friday)
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorian(jy, jm, jd);
  const date = new Date(g.gy, g.gm - 1, g.gd);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  // Convert to Saturday-based: Saturday = 0, Sunday = 1, ..., Friday = 6
  return (day + 1) % 7;
}

// Format date to "YYYY/MM/DD"
export function formatJalali(j: JalaliDate): string {
  const m = j.jm < 10 ? `0${j.jm}` : `${j.jm}`;
  const d = j.jd < 10 ? `0${j.jd}` : `${j.jd}`;
  return `${j.jy}/${m}/${d}`;
}

// Parse "YYYY/MM/DD" to JalaliDate
export function parseJalali(str: string): JalaliDate | null {
  if (!str) return null;
  const parts = str.split('/').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { jy: parts[0], jm: parts[1], jd: parts[2] };
}

// Get current Jalali date
export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Get formatted today string: "1403/07/01"
export function getTodayJalaliString(): string {
  return formatJalali(getTodayJalali());
}

// Format to human-readable string: "شنبه ۱ مهر ۱۴۰۳"
export function formatJalaliHuman(j: JalaliDate): string {
  const dayOfWeek = PERSIAN_WEEK_DAYS[getJalaliDayOfWeek(j.jy, j.jm, j.jd)];
  const monthName = PERSIAN_MONTH_NAMES[j.jm - 1];
  return `${dayOfWeek} ${j.jd} ${monthName} ${j.jy}`;
}
