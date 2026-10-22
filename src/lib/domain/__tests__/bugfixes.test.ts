// Regression tests for "Bugs for fix.md" (2026-10-21)
// هر بخش به شناسهٔ باگ (B-xx) در گزارش اشاره می‌کند تا رفع آن قابل ردیابی باشد.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gymStore } from '../../store/gymStore';
import { buildNotifications, NOTIFICATION_TABS } from '../notifications';
import { translations } from '../../i18n';
import {
  formatJalali,
  getTodayJalaliKey,
  getTodayJalaliString,
  gregorianToJalali,
  isJalaliToday,
  toCanonicalJalali,
} from '../../date/jalali';
import { validateBooking, checkCompletable, canonicalDate } from '../bookingPolicy';
import { resolveTab } from '../../navigation';
import { translateStoreMessage } from '../../../api/_messages';
import type { DailySession, Member, Trainer, UserAccount } from '../gymManagement';

/** تاریخ جلالی با فاصلهٔ چند روز از امروز */
function jalaliOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatJalali(gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()));
}

const TODAY = getTodayJalaliString();
const YESTERDAY = jalaliOffset(-1);
const TOMORROW = jalaliOffset(1);
/** ساعت مرجع ثابت تا سیاست ۴ ساعته به ساعت اجرای تست وابسته نباشد */
const TEST_NOW = new Date(2026, 0, 1, 10, 0, 0);

function member(over: Partial<Member> = {}): Member {
  return {
    id: 'm-a',
    name: 'عضو الف (Alef)',
    phone: '09120000001',
    defaultTrainerId: 't-a',
    defaultTrainerName: 'مربی الف (Coach A)',
    packageName: 'بسته',
    totalSessions: 10,
    usedSessions: 0,
    remainingSessions: 10,
    packagePrice: 1000000,
    paidAmount: 1000000,
    outstandingBalance: 0,
    startDate: '1405/01/01',
    expirationDate: '1499/12/29',
    status: 'active',
    registrationDate: '1405/01/01',
    ...over,
  };
}

function trainer(over: Partial<Trainer> = {}): Trainer {
  return {
    id: 't-a',
    name: 'مربی الف (Coach A)',
    phone: '09120000000',
    specialty: 'تست',
    status: 'active',
    workingDays: ['Saturday'],
    workingHours: '08:00 - 22:00',
    dailyCapacity: 5,
    sessionRate: 100000,
    completedSessions: 0,
    paidCompensation: 0,
    outstandingCompensation: 0,
    ...over,
  };
}

function session(over: Partial<DailySession> = {}): DailySession {
  return {
    id: 's-1',
    date: TODAY,
    time: '18:00',
    memberId: 'm-a',
    memberName: 'عضو الف (Alef)',
    trainerId: 't-a',
    trainerName: 'مربی الف (Coach A)',
    status: 'scheduled',
    exercises: [],
    ...over,
  };
}

const PERSIAN_DIGIT = /[۰-۹]/;

/** فایل‌های tsx زیر یک پوشه (برای تست‌های regression متنی) */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

export function runBugfixTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];
  const assert = (cond: boolean, name: string) => {
    if (cond) passed++;
    else {
      failed++;
      errors.push(`Assertion failed: ${name}`);
    }
  };

  // نگه‌داشتن وضعیت اصلی استور
  const snapshot = {
    gym: gymStore.gym,
    members: gymStore.members,
    trainers: gymStore.trainers,
    todaySessions: gymStore.todaySessions,
    pastSessions: gymStore.pastSessions,
    users: gymStore.users,
    currentUser: gymStore.currentUser,
    previewUser: gymStore.previewUser,
    dailyCapacityConfigs: gymStore.dailyCapacityConfigs,
    auditLogs: gymStore.auditLogs,
  };
  const reset = () => {
    gymStore.gym = { ...snapshot.gym, capacity: 30, hourlyCapacity: 6 };
    gymStore.members = [member(), member({ id: 'm-b', name: 'عضو ب (Be)' })];
    gymStore.trainers = [trainer(), trainer({ id: 't-b', name: 'مربی ب (Coach B)' })];
    gymStore.todaySessions = [];
    gymStore.pastSessions = [];
    gymStore.dailyCapacityConfigs = {};
    gymStore.auditLogs = [];
  };

  try {
    // ── B-04: ظرفیت و تداخل ─────────────────────────────────────────
    reset();
    gymStore.gym = { ...gymStore.gym, capacity: 1 };
    const g1 = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    const g2 = gymStore.scheduleSessionOnDate(TOMORROW, '10:00', 'm-b', 't-b');
    assert(g1.success, 'B-04: first booking under gym capacity 1 should succeed');
    assert(!g2.success && g2.messageKey === 'session.gymCapacityFull', 'B-04: second booking must respect gym daily capacity');

    reset();
    const c1 = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    const c2 = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-b', 't-a');
    assert(c1.success, 'B-04: first slot with trainer should succeed');
    assert(!c2.success && c2.messageKey === 'session.timeTaken', 'B-04: one trainer cannot take two members at the same time');

    reset();
    gymStore.trainers = [trainer({ dailyCapacity: 1 }), trainer({ id: 't-b', name: 'مربی ب (Coach B)' })];
    const first = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    gymStore.cancelSession(first.session!.id);
    const afterCancel = gymStore.scheduleSessionOnDate(TOMORROW, '11:00', 'm-b', 't-a');
    assert(afterCancel.success, 'B-04: a cancelled slot must free the trainer capacity');

    reset();
    gymStore.trainers = [trainer({ dailyCapacity: 1 }), trainer({ id: 't-b', name: 'مربی ب (Coach B)', dailyCapacity: 1 })];
    const onA = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    gymStore.scheduleSessionOnDate(TOMORROW, '10:00', 'm-b', 't-b');
    const reassignFull = gymStore.reassignDailyTrainer(onA.session!.id, 't-b');
    assert(!reassignFull.success, 'B-04: reassigning to a full trainer must be rejected');
    assert(onA.session!.trainerId === 't-a', 'B-04: a rejected reassignment must not change the trainer');

    reset();
    const toMove = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    const moved = gymStore.reassignDailyTrainer(toMove.session!.id, 't-b');
    assert(moved.success && toMove.session!.trainerId === 't-b', 'B-04: reassigning to a free trainer should succeed');
    toMove.session!.status = 'completed';
    const movedDone = gymStore.reassignDailyTrainer(toMove.session!.id, 't-a');
    assert(!movedDone.success && movedDone.messageKey === 'session.notReassignable', 'B-04: a completed session cannot be reassigned');

    reset();
    gymStore.gym = { ...gymStore.gym, hourlyCapacity: 1 };
    gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-a', 't-a');
    const hourly = gymStore.scheduleSessionOnDate(TOMORROW, '09:00', 'm-b', 't-b');
    assert(!hourly.success && hourly.messageKey === 'session.gymHourlyFull', 'B-04/B-13: hourly gym capacity is enforced');

    // جابه‌جایی ساعت: نوبت همان ساعت در روز دیگر تداخل نیست
    reset();
    const today18 = session({ id: 's-today', time: '18:00' });
    const otherDay = session({ id: 's-other', date: TOMORROW, time: '20:00', memberId: 'm-b' });
    gymStore.todaySessions = [today18, otherDay];
    const resched = gymStore.rescheduleSession('s-today', '20:00', undefined, TEST_NOW);
    assert(resched.success, 'B-04: a slot at the same time on another date is not a conflict');

    // ── B-05: تاریخ canonical ───────────────────────────────────────
    reset();
    const quick = gymStore.addSessionToToday('m-a', 't-a', '12:00');
    assert(quick.session?.date === TODAY, 'B-05: quick-add stores the real Jalali date, not "Today"');

    reset();
    gymStore.todaySessions = [session({ id: 's-y', date: YESTERDAY }), session({ id: 's-t', date: TODAY, time: '19:00' })];
    const todayList = gymStore.getSessionsForDate(TODAY);
    assert(todayList.length === 1 && todayList[0].id === 's-t', 'B-05: yesterday\'s session must not appear in today\'s list');

    reset();
    gymStore.todaySessions = [session({ id: 's-real-today', date: TODAY, time: '20:00' })];
    const canonicalResched = gymStore.rescheduleSession('s-real-today', '19:00', undefined, TEST_NOW);
    assert(canonicalResched.success, 'B-05: a member can reschedule a session stored with today\'s real date');
    const canonicalCancel = gymStore.cancelSessionByMember('s-real-today', undefined, TEST_NOW);
    assert(canonicalCancel.success, 'B-05: a member can cancel a session stored with today\'s real date');

    reset();
    gymStore.todaySessions = [session({ id: 's-past', date: YESTERDAY })];
    const pastResched = gymStore.rescheduleSession('s-past', '19:00', undefined, TEST_NOW);
    assert(!pastResched.success && pastResched.messageKey === 'session.pastNotChangeable', 'B-05: past sessions cannot be rescheduled');

    reset();
    const pastBooking = gymStore.scheduleSessionOnDate(YESTERDAY, '09:00', 'm-a', 't-a');
    assert(!pastBooking.success && pastBooking.messageKey === 'session.pastDate', 'B-05: booking a past date is rejected');

    assert(isJalaliToday('Today') && isJalaliToday(TODAY) && !isJalaliToday(YESTERDAY), 'B-05: isJalaliToday handles legacy and canonical dates');
    assert(toCanonicalJalali('Today') === TODAY && canonicalDate('Today', TODAY) === TODAY, 'B-05: legacy "Today" maps to the real date');

    // ── B-06: تکمیل جلسهٔ نامعتبر ───────────────────────────────────
    reset();
    const cancelledSession = session({ id: 's-c', status: 'cancelled' });
    gymStore.todaySessions = [cancelledSession];
    const before = { ...gymStore.members[0] };
    const doneCancelled = gymStore.completeMemberSession('s-c');
    assert(!doneCancelled.success && doneCancelled.messageKey === 'session.notCompletable', 'B-06: a cancelled session cannot be completed');
    assert(gymStore.members[0].usedSessions === before.usedSessions, 'B-06: completing a cancelled session must not consume credit');
    assert(gymStore.trainers[0].completedSessions === 0, 'B-06: completing a cancelled session must not pay the trainer');
    assert(cancelledSession.status === 'cancelled', 'B-06: the cancelled status must be preserved');

    reset();
    gymStore.members = [member({ totalSessions: 5, usedSessions: 5, remainingSessions: 0 })];
    gymStore.todaySessions = [session({ id: 's-z' })];
    const noCredit = gymStore.completeMemberSession('s-z');
    assert(!noCredit.success && noCredit.messageKey === 'session.noCredit', 'B-06: a member with zero credit cannot be charged');
    assert(gymStore.members[0].usedSessions === 5, 'B-06: usedSessions must not grow past the package');

    reset();
    gymStore.members = [member({ expirationDate: '1400/01/01' })];
    gymStore.todaySessions = [session({ id: 's-e' })];
    const expired = gymStore.completeMemberSession('s-e');
    assert(!expired.success && expired.messageKey === 'session.packageExpired', 'B-06: an expired package cannot be consumed');

    assert(
      checkCompletable({ status: 'in_progress' }, { remainingSessions: 1, expirationDate: '1499/01/01' }, TODAY).ok,
      'B-06: an in-progress session with credit is completable'
    );

    // ── B-07: هویت دادهٔ پیش‌نمایش ─────────────────────────────────
    const owner: UserAccount = { id: 'u-own', username: 'own', password: 'x', role: 'owner', entityId: 'gym-1', displayName: 'مدیر' };
    const coach: UserAccount = { id: 'u-coach', username: 'coach', password: 'x', role: 'trainer', entityId: 't-a', displayName: 'مربی الف (Coach A)' };
    gymStore.users = [owner, coach];
    gymStore.currentUser = coach;
    gymStore.setPreviewUser('u-own');
    assert(gymStore.previewUser === null, 'B-07: a non-owner cannot start a preview');
    gymStore.currentUser = owner;
    gymStore.setPreviewUser('u-coach');
    assert(gymStore.actingUser?.entityId === 't-a', 'B-07: during preview the data identity is the previewed trainer');
    gymStore.setPreviewUser(null);
    assert(gymStore.actingUser?.id === 'u-own', 'B-07: clearing preview restores the owner identity');
    gymStore.setPreviewUser('u-coach');
    gymStore.logout();
    assert(gymStore.previewUser === null, 'B-07: logout clears the preview identity');

    // ── B-08: مقصد اعلان‌ها ─────────────────────────────────────────
    const todayKey = getTodayJalaliKey();
    const ownerNotes = buildNotifications({
      currentUser: { role: 'owner', entityId: 'gym-1' },
      members: [member({ remainingSessions: 1, outstandingBalance: 2500000 })],
      trainers: [trainer({ outstandingCompensation: 300000 })],
      todaySessions: [],
      pastSessions: [session({ id: 's-ns', status: 'no_show', date: YESTERDAY })],
      programs: [],
      todayKey,
      labels: translations.fa.notifications,
    });
    const ownerTabs = new Set<string>(Object.values(NOTIFICATION_TABS.owner));
    assert(ownerNotes.length >= 3, 'B-08: owner notifications are produced');
    assert(ownerNotes.every(n => !n.targetTab || ownerTabs.has(n.targetTab)), 'B-08: every owner notification targets a real owner tab');
    assert(resolveTab('members', ['dash', 'mem'] as const, 'dash', { members: 'mem' }) === 'mem', 'B-08: legacy destinations are mapped to tab keys');
    assert(resolveTab('nope', ['dash', 'mem'] as const, 'dash') === 'dash', 'B-08: unknown destinations fall back to a visible tab');

    // اعلان غیبت برای خود مربی (PROJECT_STATUS P2)
    const trainerNotes = buildNotifications({
      currentUser: { role: 'trainer', entityId: 't-a' },
      members: [],
      trainers: [trainer()],
      todaySessions: [],
      pastSessions: [session({ id: 's-ns2', status: 'no_show', date: YESTERDAY })],
      programs: [],
      todayKey,
      labels: translations.fa.notifications,
    });
    assert(trainerNotes.some(n => n.kind === 'no_show'), 'P2: the affected trainer is notified about no-shows');

    // ── B-15: اعلان انگلیسی ─────────────────────────────────────────
    const enNotes = buildNotifications({
      currentUser: { role: 'owner', entityId: 'gym-1' },
      members: [member({ remainingSessions: 2, outstandingBalance: 6000000 })],
      trainers: [],
      todaySessions: [],
      pastSessions: [],
      programs: [],
      todayKey,
      labels: translations.en.notifications,
      lang: 'en',
      nameOf: raw => raw.match(/\(([^()]*)\)\s*$/)?.[1] ?? raw,
    });
    assert(enNotes.length > 0, 'B-15: English notifications are produced');
    assert(enNotes.every(n => !PERSIAN_DIGIT.test(n.body + n.title + n.timestamp)), 'B-15: English notifications contain no Persian digits');
    assert(enNotes.some(n => n.body.includes('Alef')), 'B-15: English notifications show the Latin member name');
    assert(!PERSIAN_DIGIT.test(translateStoreMessage('session.completed', { remaining: 6 }, 'en')), 'B-15: translated store messages use Latin digits in English');

    // ── B-13: تنظیمات و اقدام‌های مالک ──────────────────────────────
    reset();
    const badCap = gymStore.updateGymSettings({ capacity: 0 });
    assert(!badCap.success && gymStore.gym.capacity === 30, 'B-13: invalid capacity is rejected without mutation');
    const okCap = gymStore.updateGymSettings({ capacity: 12, hourlyCapacity: 3, noShowDeductsSession: true });
    assert(okCap.success && gymStore.gym.capacity === 12 && gymStore.gym.hourlyCapacity === 3, 'B-13: gym settings are saved');
    assert(gymStore.getGymDailyCapacity(TOMORROW) === 12, 'B-13: the saved daily capacity is used by scheduling');
    const changed = gymStore.changeMemberDefaultTrainer('m-a', 't-b');
    assert(changed.success && gymStore.members[0].defaultTrainerId === 't-b', 'B-13: the permanent trainer can be changed');
    assert(gymStore.auditLogs.some(a => a.action === 'DEFAULT_TRAINER_CHANGED'), 'B-13: trainer change is audited');

    // ── لغو توسط مربی/مدیر بدون محدودیت ۴ ساعته (PROJECT_STATUS P2) ──
    reset();
    gymStore.todaySessions = [session({ id: 's-soon', time: '00:01' })];
    const staffCancel = gymStore.cancelSession('s-soon');
    assert(staffCancel.success && gymStore.todaySessions[0].status === 'cancelled', 'P2: staff can cancel regardless of the 4-hour cutoff');
    assert(!gymStore.cancelSession('s-soon').success, 'P2: cancelling twice reports a failure');

    // ── validator مستقل ─────────────────────────────────────────────
    const v = validateBooking(
      [session({ id: 'x', status: 'cancelled', date: TOMORROW, time: '09:00' })],
      { date: TOMORROW, time: '09:00', memberId: 'm-a', trainerId: 't-a' },
      { today: TODAY, gymDailyCapacity: 1, trainerDailyCapacity: 1, trainerName: 'A', memberName: 'M' }
    );
    assert(v.ok, 'B-04: cancelled sessions do not consume capacity or the time slot');

    // ── B-09 / B-14: regression متنی روی فایل‌های رابط ───────────────
    const files = tsxFiles(join(process.cwd(), 'src'));
    const rawDisplayName = files.filter(f =>
      readFileSync(f, 'utf8')
        .split('\n')
        .some(line => /^\s*displayName\(/.test(line) || /\}: displayName\(/.test(line) || /\$displayName\(/.test(line))
    );
    assert(rawDisplayName.length === 0, `B-09: displayName(...) is never rendered as raw text (${rawDisplayName.join(', ')})`);
    const login = readFileSync(join(process.cwd(), 'src/features/auth/LoginScreen.tsx'), 'utf8');
    assert(!/^\s*t\.login\.footer\s*$/m.test(login), 'B-14: the login footer is rendered from the dictionary');
    assert(!login.includes('{t.roles.trainer}s'), 'B-14: the trainer tab label is not suffixed with a Latin "s"');
  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.message ?? e}`);
  } finally {
    Object.assign(gymStore, snapshot);
  }

  return { passed, failed, errors };
}
