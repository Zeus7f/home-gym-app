// سلسله‌مراتب نقش‌ها، ساخت حساب‌ها، باشگاه‌های چندگانه و نگاشت دادهٔ ابری (B-03)

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gymStore } from '../../supabase/mockStore';
import { can, creatableRoles, HOME_PATH } from '../../auth/permissions';
import { normalizeLoginId, normalizePhone, isValidMobile } from '../../phone';
import { diffRecords, indexRecords, recordsToState, stateToRecords } from '../../data/records';
import { validateBooking, checkCompletable } from '../bookingPolicy';
import { getTodayJalaliString } from '../../date/jalali';

export function runRolesTests() {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];
  const assert = (cond: boolean, msg: string) => {
    if (cond) passed++;
    else {
      failed++;
      errors.push(msg);
    }
  };

  const snapshot: Record<string, unknown> = {};
  for (const k of [
    'gyms', 'gym', 'users', 'currentUser', 'previewUser', 'trainers', 'members', 'memberPayments',
    'auditLogs', 'authMode', 'todaySessions', 'pastSessions',
  ]) {
    snapshot[k] = (gymStore as any)[k];
  }
  const realNotify = gymStore.notify;
  gymStore.notify = () => {};

  try {
    // ── ماتریس دسترسی ────────────────────────────────────────
    assert(can('super_admin', 'gym.manage') && !can('owner', 'gym.manage'), 'only super admin manages gyms');
    assert(can('owner', 'staff.manage') && !can('trainer', 'staff.manage'), 'only owner manages staff');
    assert(can('trainer', 'member.create') && !can('trainer', 'member.package'), 'trainer creates athletes but not packages');
    assert(!can('trainer', 'finance.view') && can('owner', 'finance.view'), 'finance is owner-only');
    assert(!can('member', 'member.create') && can('member', 'self.view'), 'members only see themselves');
    assert(!can(null, 'self.view'), 'signed-out users can do nothing');
    assert(creatableRoles('super_admin').join() === 'owner', 'super admin creates owners');
    assert(creatableRoles('owner').join() === 'trainer,member', 'owner creates trainers and athletes');
    assert(creatableRoles('trainer').join() === 'member', 'trainer creates athletes');
    assert(HOME_PATH.super_admin === '/admin', 'super admin lands on /admin');

    // ── موبایل ───────────────────────────────────────────────
    assert(normalizePhone('۰۹۱۲ ۱۱۱ ۲۲۳۳') === '09121112233', 'Persian digits and spaces');
    assert(normalizePhone('+98 912-111-2233') === '09121112233', '+98 prefix');
    assert(normalizePhone('00989121112233') === '09121112233', '0098 prefix');
    assert(normalizePhone('9121112233') === '09121112233', 'missing leading zero');
    assert(!isValidMobile('0912111223') && isValidMobile('09121112233'), 'mobile length check');
    assert(normalizeLoginId(' Admin ') === 'admin', 'non-phone ids are lowercase usernames');

    // ── باشگاه‌ها و حساب‌ها (دمو) ────────────────────────────
    gymStore.authMode = 'demo';
    gymStore.gyms = [...(snapshot.gyms as any[])];
    gymStore.users = [...(snapshot.users as any[])];
    gymStore.trainers = [...(snapshot.trainers as any[])];
    gymStore.members = [...(snapshot.members as any[])];
    gymStore.memberPayments = [...(snapshot.memberPayments as any[])];
    gymStore.auditLogs = [...(snapshot.auditLogs as any[])];

    assert(gymStore.users.some(u => u.role === 'super_admin'), 'demo has a super admin account');

    const weak = gymStore.createGym({ name: 'Gym B', capacity: 20, ownerName: 'Owner B', ownerPhone: '09351112233', ownerPassword: '123' });
    assert(!weak.success && weak.messageKey === 'account.weakPassword', 'new accounts need 8+ character passwords');
    const dupPhone = gymStore.createGym({ name: 'Gym B', capacity: 20, ownerName: 'Owner B', ownerPhone: '09121112233', ownerPassword: 'password-1' });
    assert(!dupPhone.success && dupPhone.messageKey === 'account.phoneTaken', 'phone numbers are unique');
    const created = gymStore.createGym({ name: 'Gym B', capacity: 20, ownerName: 'Owner B', ownerPhone: '۰۹۳۵۱۱۱۲۲۳۳', ownerPassword: 'password-1' });
    assert(created.success && !!created.gymId, 'super admin creates a gym with its owner');
    const ownerB = gymStore.users.find(u => u.gymId === created.gymId && u.role === 'owner');
    assert(!!ownerB && ownerB.phone === '09351112233', 'owner account uses the normalized phone');

    const summaries = gymStore.gymSummaries();
    assert(summaries.some(s => s.gym.id === created.gymId && s.trainers === 0 && s.owner?.id === ownerB?.id), 'gym list shows the new empty gym');

    gymStore.setGymActive(created.gymId!, false);
    gymStore.currentUser = null;
    const blocked = gymStore.login('09351112233', 'password-1');
    assert(!blocked.success && blocked.messageKey === 'login.gymInactive', 'deactivated gym blocks sign-in');
    gymStore.setGymActive(created.gymId!, true);

    // ── مربی ورزشکار می‌سازد؛ بسته معلق است ─────────────────
    const trainer = gymStore.trainers[0];
    const pending = gymStore.addMember(
      {
        name: 'New Athlete', phone: '09391234567', defaultTrainerId: 'x', defaultTrainerName: 'x',
        packageName: 'Gold', totalSessions: 20, packagePrice: 999, paidAmount: 999,
        startDate: getTodayJalaliString(), expirationDate: '', status: 'active',
      },
      'password-1',
      { byTrainerId: trainer.id }
    );
    const m = pending.member!;
    assert(pending.success && pending.messageKey === 'member.createdPending', 'trainer-created athlete is pending');
    assert(m.packagePending === true && m.packagePrice === 0 && m.totalSessions === 0, 'trainer cannot set package or price');
    assert(m.defaultTrainerId === trainer.id, 'athlete is assigned to the creating trainer');

    const today = getTodayJalaliString();
    const booking = validateBooking([], { date: today, time: '23:00', memberId: m.id, trainerId: trainer.id }, {
      today, gymDailyCapacity: 30, trainerDailyCapacity: 6, trainerName: 't', memberName: 'm',
      allowPastDate: true, memberPackagePending: true,
    });
    assert(!booking.ok && booking.messageKey === 'session.packagePending', 'pending athletes cannot be booked');
    assert(!checkCompletable({ status: 'scheduled' }, m, today).ok, 'pending athletes cannot complete sessions');

    const badPkg = gymStore.assignMemberPackage(m.id, { packageName: '', totalSessions: 0, packagePrice: 0, paidAmount: 0, startDate: today, expirationDate: '' });
    assert(!badPkg.success, 'empty package is rejected');
    const pkg = gymStore.assignMemberPackage(m.id, { packageName: 'Gold', totalSessions: 12, packagePrice: 1000, paidAmount: 400, startDate: today, expirationDate: '' });
    assert(pkg.success && !m.packagePending && m.remainingSessions === 12 && m.outstandingBalance === 600, 'owner sets the package');

    const acct = gymStore.accountFor('member', m.id)!;
    assert(!!acct && acct.username === '09391234567', 'athlete account uses phone as username');
    gymStore.setAccountActive(acct.id, false);
    gymStore.currentUser = null;
    const off = gymStore.login('09391234567', 'password-1');
    assert(!off.success && off.messageKey === 'login.inactive', 'deactivated account cannot sign in');

    // ── نگاشت ابری ──────────────────────────────────────────
    const state = {
      trainers: [trainer],
      members: [m],
      todaySessions: [{ id: 's1', date: today, time: '10:00', memberId: m.id, memberName: m.name, trainerId: trainer.id, trainerName: trainer.name, status: 'scheduled', exercises: [] }],
      pastSessions: [{ id: 's0', date: '1405/01/01', time: '09:00', memberId: m.id, memberName: m.name, trainerId: trainer.id, trainerName: trainer.name, status: 'completed', exercises: [] }],
      memberPayments: [], trainerPayouts: [], sessionAdjustments: [], auditLogs: [],
      exercises: [...gymStore.exercises.slice(0, 3), { ...gymStore.exercises[3], isCustom: true, id: 'custom-1' }],
      dailyCapacityConfigs: { '1405/07/30': { date: '1405/07/30', gymCapacity: 10 } },
      programs: [],
    } as any;
    const rows = stateToRecords(state);
    assert(rows.filter(r => r.kind === 'exercise').length === 1, 'only custom or edited exercises are stored');
    const member = rows.find(r => r.kind === 'member')!;
    assert(member.member_id === m.id && member.trainer_id === trainer.id, 'member rows carry ids for RLS');
    const back = recordsToState(rows);
    assert(back.todaySessions.length === 1 && back.pastSessions.length === 1 && !('_bucket' in back.todaySessions[0]), 'session buckets round-trip');
    assert(back.exercises.some(e => e.id === 'custom-1') && back.exercises.length > 400, 'catalog plus custom exercises');
    assert(back.dailyCapacityConfigs['1405/07/30']?.gymCapacity === 10, 'capacity overrides round-trip');

    const base = indexRecords(rows);
    const changed = { ...state, members: [{ ...m, usedSessions: 1 }], pastSessions: [] };
    const diff = diffRecords(base, stateToRecords(changed));
    assert(diff.upserts.length === 1 && diff.upserts[0].kind === 'member', 'only changed rows are written');
    assert(diff.deletes.length === 1 && diff.deletes[0].id === 's0', 'removed rows are deleted');

    // ── SQL: محافظ‌ها ────────────────────────────────────────
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/20261023000000_gym_tenant_data.sql'), 'utf8');
    assert(sql.includes("(data->>'packagePending')::boolean IS TRUE"), 'RLS: trainer inserts only pending athletes');
    assert(sql.includes("allowed := ARRAY['usedSessions', 'remainingSessions', 'status']"), 'trigger: trainer only moves session counters');
    assert(sql.includes("kind NOT IN ('payment', 'payout', 'audit')"), 'RLS: trainers cannot read finance');
  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.stack ?? e}`);
  } finally {
    Object.assign(gymStore, snapshot);
    gymStore.notify = realNotify;
  }
  return { passed, failed, errors };
}
