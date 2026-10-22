// سلسله‌مراتب نقش‌ها، ساخت حساب‌ها و بستهٔ معلق

import { gymStore } from '../../store/gymStore';
import { can, creatableRoles } from '../../auth/permissions';
import { homePath, resolveSection } from '../../routes';
import { normalizeLoginId, normalizePhone, isValidMobile } from '../../phone';
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
    'auditLogs', 'todaySessions', 'pastSessions',
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
    assert(homePath('super_admin') === '/admin/gyms' && homePath('owner') === '/owner/dashboard', 'roles land on their canonical home path');
    assert(resolveSection('owner', 'mem') === 'memberships' && resolveSection('owner', 'rep') === 'analytics', 'legacy owner ?tab= keys map to canonical sections');
    assert(resolveSection('trainer', 'cat') === 'exercises' && resolveSection('member', 'hist') === 'progress', 'legacy trainer/member keys map to canonical sections');
    assert(resolveSection('owner', 'nope') === 'dashboard', 'unknown destinations fall back to the role home');

    // ── موبایل ───────────────────────────────────────────────
    assert(normalizePhone('۰۹۱۲ ۱۱۱ ۲۲۳۳') === '09121112233', 'Persian digits and spaces');
    assert(normalizePhone('+98 912-111-2233') === '09121112233', '+98 prefix');
    assert(normalizePhone('00989121112233') === '09121112233', '0098 prefix');
    assert(normalizePhone('9121112233') === '09121112233', 'missing leading zero');
    assert(!isValidMobile('0912111223') && isValidMobile('09121112233'), 'mobile length check');
    assert(normalizeLoginId(' Admin ') === 'admin', 'non-phone ids are lowercase usernames');

    // ── حساب‌ها ─────────────────────────────────────────────
    gymStore.users = [...(snapshot.users as any[])];
    gymStore.trainers = [...(snapshot.trainers as any[])];
    gymStore.members = [...(snapshot.members as any[])];
    gymStore.memberPayments = [...(snapshot.memberPayments as any[])];
    gymStore.auditLogs = [...(snapshot.auditLogs as any[])];
    assert(gymStore.users.some(u => u.role === 'super_admin'), 'sample data has a super admin account');

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

  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.stack ?? e}`);
  } finally {
    Object.assign(gymStore, snapshot);
    gymStore.notify = realNotify;
  }
  return { passed, failed, errors };
}
