// Domain Unit Tests: Store session accounting + notification engine
// Covers atomic session completion, idempotency, reschedule/cancel policy,
// and the role-aware notification builder.

import { gymStore } from '../../store/gymStore';
import { buildNotifications, daysUntilJalali, packageStatus } from '../notifications';
import { translations } from '../../i18n';
import { getTodayJalaliKey } from '../../date/jalali';
import type { DailySession, Member } from '../gymManagement';

/** یک عضو و مربی ایزوله برای تست — استور واقعی دست‌نخورده می‌ماند */
function makeMember(over: Partial<Member> = {}): Member {
  return {
    id: 'm-test',
    name: 'عضو تست',
    phone: '09120000000',
    defaultTrainerId: 't-test',
    defaultTrainerName: 'مربی تست',
    packageName: 'بسته تست',
    totalSessions: 10,
    usedSessions: 0,
    remainingSessions: 10,
    packagePrice: 1000000,
    paidAmount: 1000000,
    outstandingBalance: 0,
    startDate: '1405/01/01',
    // انقضای دور تا تست‌ها با گذشت زمان (و قانون انقضای بسته در B-06) شکننده نشوند
    expirationDate: '1499/12/29',
    status: 'active',
    registrationDate: '1405/01/01',
    ...over,
  };
}

function makeSession(over: Partial<DailySession> = {}): DailySession {
  return {
    id: 'sess-test',
    date: 'Today',
    time: '18:00',
    memberId: 'm-test',
    memberName: 'عضو تست',
    memberPhone: '09120000000',
    trainerId: 't-test',
    trainerName: 'مربی تست',
    status: 'scheduled',
    exercises: [],
    ...over,
  };
}

/**
 * ساعت مرجع ثابت برای تست‌ها.
 *
 * سیاست «۴ ساعت قبل» به زمان واقعی سیستم وابسته است؛ اگر تست‌ها از
 * new Date() استفاده کنند، فقط در بخشی از روز پاس می‌شوند (تست شکننده).
 * با تزریق یک ساعت مرجع، رفتار همیشه یکسان و قابل پیش‌بینی است.
 */
const TEST_NOW = new Date(2026, 0, 1, 10, 0, 0); // ۱۰:۰۰ صبح

export function runStoreTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  // ── 1. Atomic session completion ────────────────────────────────
  const member = makeMember({ totalSessions: 10, usedSessions: 3, remainingSessions: 7 });
  const session = makeSession();

  const originalMembers = gymStore.members;
  const originalToday = gymStore.todaySessions;
  gymStore.members = [member];
  gymStore.todaySessions = [session];

  const first = gymStore.completeMemberSession(session.id);
  assert(first.idempotent === false, 'the first completion should not be idempotent');
  assert(first.remainingSessions === 6, 'exactly one session should be deducted (7 → 6)');
  assert(member.usedSessions === 4, 'usedSessions should increment by exactly 1');
  assert(member.remainingSessions === 6, 'remainingSessions should be recomputed');
  assert(session.status === 'completed', 'the session should be marked completed');

  // ── 2. Idempotency: calling twice must not deduct twice ────────
  const second = gymStore.completeMemberSession(session.id);
  assert(second.idempotent === true, 'a second completion should be idempotent');
  assert(second.remainingSessions === 6, 'the second call must not deduct another session');
  assert(member.usedSessions === 4, 'usedSessions must stay at 4 after a duplicate call');

  // ── 3. Missing session ──────────────────────────────────────────
  let threw = false;
  try {
    gymStore.completeMemberSession('does-not-exist');
  } catch {
    threw = true;
  }
  assert(threw, 'completing a non-existent session should throw');

  // ── 4. Exercises are persisted on completion ─────────────────────
  const sessionWithExercises = makeSession({ id: 'sess-with-ex' });
  gymStore.todaySessions = [sessionWithExercises];
  gymStore.completeMemberSession(sessionWithExercises.id, [
    {
      id: 'rec-1',
      exerciseId: 'ex-bench-press',
      name: 'پرس سینه',
      bodyPart: 'سینه',
      equipment: 'هالتر',
      sets: 3,
      reps: 10,
      weightKg: 40,
      completedSets: [
        { r: 10, w: 40, d: true },
        { r: 10, w: 42.5, d: true },
      ],
    },
  ]);
  assert(
    sessionWithExercises.exercises.length === 1,
    'the recorded exercises should be persisted on the session'
  );
  assert(
    sessionWithExercises.exercises[0].completedSets?.length === 2,
    'the per-set detail should be persisted'
  );
  assert(
    sessionWithExercises.exercises[0].exerciseId === 'ex-bench-press',
    'the real catalog exerciseId should be preserved'
  );

  // ── 5. Reschedule policy ────────────────────────────────────────
  const reschedulable = makeSession({ id: 'sess-resched', time: '20:00' }); // ۱۰ ساعت بعد
  gymStore.todaySessions = [reschedulable];

  const moved = gymStore.rescheduleSession(reschedulable.id, '19:00', undefined, TEST_NOW);
  assert(moved.success === true, 'rescheduling to a free slot should succeed');
  assert(reschedulable.time === '19:00', 'the session time should be updated');
  assert(
    member.remainingSessions === 5,
    'rescheduling must not deduct a session from the member'
  );

  // تداخل با سانس دیگر
  const conflicting = makeSession({ id: 'sess-conflict', time: '21:00' });
  gymStore.todaySessions = [reschedulable, conflicting];
  const conflictRes = gymStore.rescheduleSession(reschedulable.id, '21:00', undefined, TEST_NOW);
  assert(conflictRes.success === false, 'rescheduling into an occupied slot should fail');
  assert(reschedulable.time === '19:00', 'a failed reschedule must not change the time');

  // جلسه تکمیل‌شده قابل جابه‌جایی نیست
  const completed = makeSession({ id: 'sess-done', status: 'completed' });
  gymStore.todaySessions = [completed];
  const doneRes = gymStore.rescheduleSession(completed.id, '19:00', undefined, TEST_NOW);
  assert(doneRes.success === false, 'a completed session cannot be rescheduled');

  // نوبت آینده از طریق مدیر باشگاه
  const future = makeSession({ id: 'sess-future', date: '1405/12/01' });
  gymStore.todaySessions = [future];
  const futureRes = gymStore.rescheduleSession(future.id, '19:00', undefined, TEST_NOW);
  assert(futureRes.success === false, 'a future session cannot be rescheduled by the member');

  // ── 6. Cancel by member ─────────────────────────────────────────
  const cancellable = makeSession({ id: 'sess-cancel', time: '20:00' }); // ۱۰ ساعت بعد
  gymStore.todaySessions = [cancellable];
  const cancelled = gymStore.cancelSessionByMember(cancellable.id, undefined, TEST_NOW);
  assert(cancelled.success === true, 'cancelling a future-today slot should succeed');
  assert(cancellable.status === 'cancelled', 'the session should be marked cancelled');
  assert(
    member.remainingSessions === 5,
    'cancelling must not deduct a session from the member'
  );

  // ── 6b. سیاست ۴ ساعته با ساعت مرجع ثابت ────────────────────────
  const tooSoon = makeSession({ id: 'sess-soon', time: '12:00' }); // ۲ ساعت بعد
  gymStore.todaySessions = [tooSoon];
  const tooSoonRes = gymStore.rescheduleSession(tooSoon.id, '16:00', undefined, TEST_NOW);
  assert(tooSoonRes.success === false, 'a session 2 hours away must be rejected');
  assert(
    tooSoonRes.message.includes('۴ ساعت'),
    'the cutoff error message should mention the 4-hour rule'
  );
  assert(tooSoon.time === '12:00', 'a rejected reschedule must not change the time');

  // دقیقاً روی مرز ۴ ساعت — مجاز است
  const exactlyFour = makeSession({ id: 'sess-edge', time: '14:00' }); // دقیقاً ۴ ساعت بعد
  gymStore.todaySessions = [exactlyFour];
  const edgeRes = gymStore.rescheduleSession(exactlyFour.id, '16:00', undefined, TEST_NOW);
  assert(edgeRes.success === true, 'exactly 4 hours away should still be allowed');

  // ── 7. Audit log entries ────────────────────────────────────────
  const auditActions = gymStore.auditLogs.map(a => a.action);
  assert(
    auditActions.includes('SESSION_RESCHEDULED'),
    'a reschedule should write a SESSION_RESCHEDULED audit entry'
  );
  assert(
    auditActions.includes('SESSION_CANCELLED'),
    'a cancellation should write a SESSION_CANCELLED audit entry'
  );
  assert(
    auditActions.includes('SESSION_COMPLETED'),
    'a completion should write a SESSION_COMPLETED audit entry'
  );

  // ── 7b. Quick add validates capacity and duplicates ─────────────
  const originalTrainers = gymStore.trainers;
  gymStore.trainers = [
    {
      id: 't-test',
      name: 'مربی تست',
      phone: '09120000000',
      specialty: 'تست',
      status: 'active',
      workingDays: ['Saturday'],
      workingHours: '09:00 - 15:00',
      dailyCapacity: 2,
      sessionRate: 150000,
      completedSessions: 0,
      paidCompensation: 0,
      outstandingCompensation: 0,
    },
  ];
  gymStore.todaySessions = [
    makeSession({ id: 'qa-1', time: '09:00' }),
    makeSession({ id: 'qa-2', time: '10:00' }),
  ];

  // ظرفیت پر است
  const overCapacity = gymStore.addSessionToToday('m-test', 't-test', '12:00');
  assert(overCapacity.success === false, 'adding beyond the trainer capacity should fail');
  assert(
    overCapacity.message.includes('ظرفیت'),
    'the capacity error message should mention capacity'
  );

  // نوبت تکراری در همان ساعت
  const duplicate = gymStore.addSessionToToday('m-test', 't-test', '09:00');
  assert(duplicate.success === false, 'adding a duplicate slot should fail');

  // ظرفیت خالی — باید موفق شود
  gymStore.todaySessions = [makeSession({ id: 'qa-1', time: '09:00' })];
  const ok = gymStore.addSessionToToday('m-test', 't-test', '11:00');
  assert(ok.success === true, 'adding within capacity should succeed');
  assert(ok.session?.time === '11:00', 'the created session should have the requested time');
  assert(ok.session?.status === 'scheduled', 'the created session should be scheduled');

  gymStore.trainers = originalTrainers;

  // بازگرداندن استور به حالت اول
  gymStore.members = originalMembers;
  gymStore.todaySessions = originalToday;

  // ── 8. Notification engine ──────────────────────────────────────
  const todayKey = getTodayJalaliKey();

  // روز تا انقضا
  const days = daysUntilJalali('1405/12/29', todayKey);
  assert(days !== null, 'daysUntilJalali should parse a valid Jalali date');
  assert(typeof days === 'number', 'daysUntilJalali should return a number');
  assert(daysUntilJalali('invalid', todayKey) === null, 'an invalid date should return null');

  // وضعیت اعتبار
  assert(packageStatus(makeMember({ remainingSessions: 10 }), todayKey) === 'healthy', '10 sessions left should be healthy');
  assert(packageStatus(makeMember({ remainingSessions: 2 }), todayKey) === 'low', '2 sessions left should be low');
  assert(packageStatus(makeMember({ remainingSessions: 0 }), todayKey) === 'exhausted', '0 sessions left should be exhausted');

  // اعلان ورزشکار با اعتبار رو به اتمام
  const memberNotifications = buildNotifications({
    currentUser: { role: 'member', entityId: 'm-test' },
    members: [makeMember({ id: 'm-test', remainingSessions: 1, totalSessions: 10 })],
    trainers: [],
    todaySessions: [],
    pastSessions: [],
    programs: [],
    todayKey,
    labels: translations.fa.notifications,
  });
  assert(
    memberNotifications.some(n => n.kind === 'low_balance'),
    'a member with 1 session left should get a low_balance notification'
  );

  // اعلان نوبت پیش‌رو
  const upcomingNotifications = buildNotifications({
    currentUser: { role: 'member', entityId: 'm-test' },
    members: [makeMember({ id: 'm-test' })],
    trainers: [],
    todaySessions: [makeSession({ memberId: 'm-test' })],
    pastSessions: [],
    programs: [],
    todayKey,
    labels: translations.fa.notifications,
  });
  assert(
    upcomingNotifications.some(n => n.kind === 'upcoming_session'),
    'a member with a scheduled session today should get an upcoming_session notification'
  );

  // اعلان برنامه منتشرشده
  const programNotifications = buildNotifications({
    currentUser: { role: 'member', entityId: 'm-test' },
    members: [makeMember({ id: 'm-test' })],
    trainers: [],
    todaySessions: [],
    pastSessions: [],
    programs: [
      {
        id: 'p1',
        memberId: 'm-test',
        memberName: 'عضو تست',
        trainerId: 't-test',
        trainerName: 'مربی تست',
        title: 'برنامه تست',
        days: [],
        status: 'published',
        createdAt: '1405/07/01',
        updatedAt: '1405/07/01',
      },
    ],
    todayKey,
    labels: translations.fa.notifications,
  });
  assert(
    programNotifications.some(n => n.kind === 'program_published'),
    'a member with a published program should get a program_published notification'
  );

  // اعلان مدیر: بهدهی باز
  const ownerNotifications = buildNotifications({
    currentUser: { role: 'owner', entityId: 'gym-1' },
    members: [makeMember({ id: 'm-test', outstandingBalance: 500000 })],
    trainers: [],
    todaySessions: [],
    pastSessions: [],
    programs: [],
    todayKey,
    labels: translations.fa.notifications,
  });
  assert(
    ownerNotifications.some(n => n.kind === 'payment_due'),
    'an owner with members in debt should get a payment_due notification'
  );

  // کاربر واردنشده هیچ اعلانی نمی‌گیرد
  assert(
    buildNotifications({
      currentUser: null,
      members: [],
      trainers: [],
      todaySessions: [],
      pastSessions: [],
      programs: [],
      todayKey,
      labels: translations.fa.notifications,
    }).length === 0,
    'a signed-out user should get no notifications'
  );

  return { passed, failed, errors };
}
