/**
 * src/lib/domain/reporting.ts
 * جمع‌بندی گزارش‌های باشگاه در یک بازهٔ زمانی — منطق خالص و بدون وابستگی به UI.
 *
 * گزارش روزانه، هفتگی و ماهانه همگی یک محاسبه‌اند با بازهٔ متفاوت؛ فیلتر
 * «مربی» یا «ورزشکار» هم فقط مجموعهٔ نوبت‌ها را محدود می‌کند، نه فرمول را.
 */

import type { DailySession, Member, Trainer } from './gymManagement';
import {
  formatJalali,
  getJalaliDayOfWeek,
  getJalaliMonthDays,
  gregorianToJalali,
  jalaliToGregorian,
  parseJalali,
} from '../date/jalali';

export type ReportPeriod = 'day' | 'week' | 'month';

/** فیلتر شخص: کل باشگاه، یک مربی، یا یک ورزشکار */
export interface ReportScope {
  kind: 'all' | 'trainer' | 'member';
  id?: string;
}

export interface ReportRange {
  /** روز نخست بازه، «YYYY/MM/DD» */
  from: string;
  /** روز پایانی بازه (شامل خودش)، «YYYY/MM/DD» */
  to: string;
  /** همهٔ روزهای بازه به ترتیب — ستون‌های نمودار */
  days: string[];
}

/** تاریخ جلالی به‌اضافهٔ چند روز */
function addDays(date: string, delta: number): string {
  const parsed = parseJalali(date);
  if (!parsed) return date;
  const g = jalaliToGregorian(parsed.jy, parsed.jm, parsed.jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  d.setDate(d.getDate() + delta);
  return formatJalali(gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let cursor = from;
  // سقف ایمنی: بلندترین بازهٔ پشتیبانی‌شده یک ماه است
  for (let i = 0; i < 40 && cursor <= to; i++) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

/**
 * بازهٔ گزارش بر پایهٔ یک روز لنگر.
 * هفته از شنبه تا جمعه و ماه از یکم تا پایان همان ماه جلالی است.
 */
export function rangeFor(period: ReportPeriod, anchor: string): ReportRange {
  const parsed = parseJalali(anchor);
  if (!parsed) return { from: anchor, to: anchor, days: [anchor] };

  if (period === 'day') {
    return { from: anchor, to: anchor, days: [anchor] };
  }
  if (period === 'week') {
    const dow = getJalaliDayOfWeek(parsed.jy, parsed.jm, parsed.jd); // ۰ = شنبه
    const from = addDays(anchor, -dow);
    const to = addDays(from, 6);
    return { from, to, days: daysBetween(from, to) };
  }
  const from = formatJalali({ jy: parsed.jy, jm: parsed.jm, jd: 1 });
  const to = formatJalali({ jy: parsed.jy, jm: parsed.jm, jd: getJalaliMonthDays(parsed.jy, parsed.jm) });
  return { from, to, days: daysBetween(from, to) };
}

/** جابه‌جایی بازه به دورهٔ قبل یا بعد؛ خروجی، لنگر تازه است. */
export function shiftAnchor(period: ReportPeriod, anchor: string, direction: 1 | -1): string {
  if (period === 'day') return addDays(anchor, direction);
  if (period === 'week') return addDays(anchor, direction * 7);

  const parsed = parseJalali(anchor);
  if (!parsed) return anchor;
  let { jy, jm } = parsed;
  jm += direction;
  if (jm > 12) {
    jm = 1;
    jy += 1;
  } else if (jm < 1) {
    jm = 12;
    jy -= 1;
  }
  // روز را به آخرین روز معتبر ماه مقصد می‌چسبانیم (۳۱ اسفند وجود ندارد)
  return formatJalali({ jy, jm, jd: Math.min(parsed.jd, getJalaliMonthDays(jy, jm)) });
}

export interface PersonBreakdown {
  id: string;
  name: string;
  booked: number;
  completed: number;
  /** فقط برای مربی: دستمزد جلسه‌های تکمیل‌شدهٔ همین بازه */
  earned?: number;
  /** فقط برای ورزشکار: جلسهٔ باقی‌مانده از بسته */
  remaining?: number;
}

export interface ReportSummary {
  range: ReportRange;
  sessions: DailySession[];
  booked: number;
  completed: number;
  cancelled: number;
  noShow: number;
  /** درصد تکمیل نسبت به نوبت‌هایی که لغو نشده‌اند */
  attendanceRate: number;
  /** تعداد ورزشکاران متمایز با دست‌کم یک نوبت فعال */
  activeAthletes: number;
  /** تعداد نوبت در هر روز بازه — به ترتیب `range.days` */
  perDay: number[];
  byTrainer: PersonBreakdown[];
  byMember: PersonBreakdown[];
}

/** آیا نوبت درون بازه و درون فیلتر شخص است؟ */
function inScope(session: DailySession, scope: ReportScope): boolean {
  if (scope.kind === 'trainer') return session.trainerId === scope.id;
  if (scope.kind === 'member') return session.memberId === scope.id;
  return true;
}

/**
 * جمع‌بندی گزارش. نوبت لغوشده در شمار «ثبت‌شده» می‌آید ولی ظرفیت و نرخ حضور را
 * اشغال نمی‌کند، چون جای خود را آزاد کرده است.
 */
export function summarize(
  allSessions: readonly DailySession[],
  period: ReportPeriod,
  anchor: string,
  scope: ReportScope,
  people: { trainers: readonly Trainer[]; members: readonly Member[] }
): ReportSummary {
  const range = rangeFor(period, anchor);
  const inRange = new Set(range.days);

  const seen = new Set<string>();
  const sessions = allSessions.filter(x => {
    if (seen.has(x.id) || !inRange.has(x.date) || !inScope(x, scope)) return false;
    seen.add(x.id);
    return true;
  });

  const completed = sessions.filter(x => x.status === 'completed').length;
  const cancelled = sessions.filter(x => x.status === 'cancelled').length;
  const noShow = sessions.filter(x => x.status === 'no_show').length;
  const counted = sessions.length - cancelled;

  const perDay = range.days.map(day => sessions.filter(x => x.date === day && x.status !== 'cancelled').length);

  const group = (key: 'trainerId' | 'memberId', nameKey: 'trainerName' | 'memberName'): PersonBreakdown[] => {
    const map = new Map<string, PersonBreakdown>();
    for (const session of sessions) {
      const id = session[key];
      const entry = map.get(id) ?? { id, name: session[nameKey], booked: 0, completed: 0 };
      entry.booked += 1;
      if (session.status === 'completed') entry.completed += 1;
      map.set(id, entry);
    }
    return [...map.values()].sort((a, b) => b.booked - a.booked);
  };

  const byTrainer = group('trainerId', 'trainerName').map(entry => {
    const trainer = people.trainers.find(x => x.id === entry.id);
    return { ...entry, earned: entry.completed * (trainer?.sessionRate ?? 0) };
  });

  const byMember = group('memberId', 'memberName').map(entry => {
    const member = people.members.find(x => x.id === entry.id);
    return { ...entry, remaining: member?.remainingSessions ?? 0 };
  });

  return {
    range,
    sessions,
    booked: sessions.length,
    completed,
    cancelled,
    noShow,
    attendanceRate: counted > 0 ? Math.round((completed / counted) * 100) : 0,
    activeAthletes: new Set(sessions.filter(x => x.status !== 'cancelled').map(x => x.memberId)).size,
    perDay,
    byTrainer,
    byMember,
  };
}
