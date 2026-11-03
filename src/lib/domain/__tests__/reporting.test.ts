// Reporting Unit Tests: بازه‌های روز/هفته/ماه و جمع‌بندی گزارش کلی

import { rangeFor, shiftAnchor, summarize } from '../reporting';
import { formatJalaliNumeric } from '../../date/jalali';
import type { DailySession, Member, Trainer } from '../gymManagement';

export function runReportingTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) passed++;
    else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  // ── بازه‌ها ───────────────────────────────────────────────────────────────
  // ۱۴۰۵/۰۸/۱۲ سه‌شنبه است، پس شنبهٔ همان هفته ۱۴۰۵/۰۸/۰۹ می‌شود.
  const day = rangeFor('day', '1405/08/12');
  assert(day.from === '1405/08/12' && day.to === '1405/08/12', 'a day range covers exactly that day');
  assert(day.days.length === 1, 'a day range has one column');

  const week = rangeFor('week', '1405/08/12');
  assert(week.days.length === 7, 'a week range has seven days');
  assert(week.from === '1405/08/09' && week.to === '1405/08/15', 'the week runs Saturday to Friday around the anchor');
  assert(week.days[0] === week.from && week.days[6] === week.to, 'the week columns run from first to last day');

  const month = rangeFor('month', '1405/08/12');
  assert(month.from === '1405/08/01', 'a month range starts on the first of the month');
  assert(month.to === '1405/08/30' && month.days.length === 30, 'Aban has 30 days');

  const esfand = rangeFor('month', '1404/12/05');
  assert(esfand.days.length === esfand.days.length && esfand.from === '1404/12/01', 'Esfand starts on the first');

  // ── تاریخ عددی با ارقام زبان فعال ─────────────────────────────────────────
  assert(formatJalaliNumeric('1405/10/12', true) === '۱۴۰۵/۱۰/۱۲', 'a Persian UI gets Persian digits');
  assert(formatJalaliNumeric('1405/10/12', false) === '1405/10/12', 'an English UI keeps Latin digits');
  assert(formatJalaliNumeric('1405/9/5', true) === '۱۴۰۵/۰۹/۰۵', 'month and day are zero padded');
  assert(formatJalaliNumeric('', true) === '', 'an empty date stays empty');
  assert(formatJalaliNumeric('nonsense', true) === 'nonsense', 'an unparsable date is returned untouched');

  // ── جابه‌جایی دوره ────────────────────────────────────────────────────────
  assert(shiftAnchor('day', '1405/08/12', 1) === '1405/08/13', 'next day');
  assert(shiftAnchor('day', '1405/08/01', -1) === '1405/07/30', 'previous day crosses the month boundary');
  assert(shiftAnchor('week', '1405/08/12', -1) === '1405/08/05', 'previous week is seven days back');
  assert(shiftAnchor('month', '1405/08/12', 1) === '1405/09/12', 'next month keeps the day');
  assert(shiftAnchor('month', '1405/01/12', -1) === '1404/12/12', 'previous month crosses the year boundary');
  assert(shiftAnchor('month', '1405/07/31', 1) === '1405/08/30', 'a 31st clamps to the last day of a 30-day month');

  // ── جمع‌بندی ──────────────────────────────────────────────────────────────
  const session = (over: Partial<DailySession>): DailySession =>
    ({
      id: 's', date: '1405/08/12', time: '18:00',
      memberId: 'm1', memberName: 'Athlete One',
      trainerId: 't1', trainerName: 'Coach A',
      status: 'completed', exercises: [],
      ...over,
    }) as DailySession;

  const trainers = [
    { id: 't1', name: 'Coach A', sessionRate: 100000 } as Trainer,
    { id: 't2', name: 'Coach B', sessionRate: 200000 } as Trainer,
  ];
  const members = [
    { id: 'm1', name: 'Athlete One', remainingSessions: 7 } as Member,
    { id: 'm2', name: 'Athlete Two', remainingSessions: 3 } as Member,
  ];

  const sessions: DailySession[] = [
    session({ id: 'a', status: 'completed' }),
    session({ id: 'b', status: 'completed', memberId: 'm2', memberName: 'Athlete Two' }),
    session({ id: 'c', status: 'cancelled' }),
    session({ id: 'd', status: 'no_show', trainerId: 't2', trainerName: 'Coach B' }),
    session({ id: 'e', status: 'scheduled', date: '1405/08/14' }),
    // بیرون از بازهٔ هفته
    session({ id: 'f', status: 'completed', date: '1405/09/02' }),
  ];

  const all = summarize(sessions, 'week', '1405/08/12', { kind: 'all' }, { trainers, members });
  assert(all.booked === 5, 'only sessions inside the range are counted');
  assert(all.completed === 2 && all.cancelled === 1 && all.noShow === 1, 'statuses are counted separately');
  assert(all.attendanceRate === 50, 'attendance ignores cancelled sessions (2 of 4)');
  assert(all.activeAthletes === 2, 'cancelled-only athletes do not count as active');
  assert(all.perDay[3] === 3, 'the anchor day holds three non-cancelled sessions');
  assert(all.perDay[5] === 1, 'the later day holds one session');
  assert(all.range.days.length === all.perDay.length, 'the chart has one column per day');

  const coachA = all.byTrainer.find(x => x.id === 't1');
  assert(coachA?.booked === 4 && coachA?.completed === 2, 'the trainer breakdown counts their own sessions');
  assert(coachA?.earned === 200000, 'trainer earnings use completed sessions times their rate');

  const athleteOne = all.byMember.find(x => x.id === 'm1');
  assert(athleteOne?.remaining === 7, 'the athlete breakdown carries the remaining package sessions');

  // فیلتر مربی
  const onlyB = summarize(sessions, 'week', '1405/08/12', { kind: 'trainer', id: 't2' }, { trainers, members });
  assert(onlyB.booked === 1 && onlyB.byTrainer.length === 1, 'filtering by trainer narrows the whole report');
  assert(onlyB.completed === 0 && onlyB.attendanceRate === 0, 'a no-show does not count as attendance');

  // فیلتر ورزشکار
  const onlyTwo = summarize(sessions, 'week', '1405/08/12', { kind: 'member', id: 'm2' }, { trainers, members });
  assert(onlyTwo.booked === 1 && onlyTwo.completed === 1, 'filtering by athlete narrows the whole report');

  // بازهٔ روز، زیرمجموعهٔ همان محاسبه است
  const oneDay = summarize(sessions, 'day', '1405/08/12', { kind: 'all' }, { trainers, members });
  assert(oneDay.booked === 4 && oneDay.range.days.length === 1, 'the day report is the same calculation on one day');

  // بازهٔ ماه همهٔ روزهای آبان را می‌گیرد
  const aban = summarize(sessions, 'month', '1405/08/12', { kind: 'all' }, { trainers, members });
  assert(aban.booked === 5 && aban.perDay.length === 30, 'the month report spans the whole month');

  // نوبت تکراری دوبار شمرده نمی‌شود
  const duplicated = summarize([...sessions, sessions[0]], 'day', '1405/08/12', { kind: 'all' }, { trainers, members });
  assert(duplicated.booked === 4, 'a session present in both buckets is counted once');

  // بازهٔ خالی
  const empty = summarize(sessions, 'day', '1405/10/01', { kind: 'all' }, { trainers, members });
  assert(empty.booked === 0 && empty.attendanceRate === 0, 'an empty range reports zeroes, not NaN');

  return { passed, failed, errors };
}
