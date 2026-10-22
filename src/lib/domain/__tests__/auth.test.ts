// احراز هویت مستقل (scrypt + JWT) و مجوز عملیات بر اساس نقش و مالکیت

import { gymStore } from '../../store/gymStore';
import type { UserAccount } from '../../store/gymStore';
import * as ops from '../operations';
import { hashPassword, signJwt, verifyJwt, verifyPassword } from '../../../server/auth/crypto';

export async function runAuthTests() {
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
  for (const k of ['members', 'trainers', 'todaySessions', 'pastSessions', 'memberPayments', 'programs', 'users', 'auditLogs', 'exercises']) {
    snapshot[k] = structuredClone((gymStore as any)[k]);
  }
  const realNotify = gymStore.notify;
  gymStore.notify = () => {};

  try {
    // ── hash رمز ────────────────────────────────────────────
    const hash = await hashPassword('correct horse battery');
    assert(hash.startsWith('scrypt$') && !hash.includes('correct'), 'password is stored as a salted scrypt hash');
    assert(await verifyPassword('correct horse battery', hash), 'correct password verifies');
    assert(!(await verifyPassword('wrong password', hash)), 'wrong password is rejected');
    assert((await hashPassword('same')) !== (await hashPassword('same')), 'every hash has its own salt');
    assert(!(await verifyPassword('x', 'plain-text')), 'malformed stored hash never verifies');

    // ── JWT ─────────────────────────────────────────────────
    const secret = 'a'.repeat(48);
    const token = signJwt({ sub: 'u1', ver: 3 }, secret, 60);
    const claims = verifyJwt(token, secret);
    assert(claims?.sub === 'u1' && claims.ver === 3, 'signed token verifies with its claims');
    assert(verifyJwt(token, 'b'.repeat(48)) === null, 'token signed with another secret is rejected');
    const [h, p, s] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'admin', ver: 3, iat: 0, exp: 9_999_999_999 })).toString('base64url');
    assert(verifyJwt(`${h}.${forged}.${s}`, secret) === null, 'tampered payload is rejected');
    assert(verifyJwt(signJwt({ sub: 'u1', ver: 1 }, secret, -10), secret) === null, 'expired token is rejected');
    const none = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${p}.`;
    assert(verifyJwt(none, secret) === null, 'unsigned (alg none) token is rejected');

    // ── مجوز عملیات ────────────────────────────────────────
    const ali = gymStore.trainers.find(t => t.id === 't-ali')!;
    const sara = gymStore.trainers.find(t => t.id === 't-sara')!;
    const owner: UserAccount = { id: 'u-owner', username: 'admin', password: '', role: 'owner', entityId: 'gym-1', displayName: 'Owner' };
    const trainerAli: UserAccount = { id: 'u-ali', username: 'ali', password: '', role: 'trainer', entityId: ali.id, displayName: 'Ali' };
    const memberOf = (id: string): UserAccount => ({ id: `u-${id}`, username: id, password: '', role: 'member', entityId: id, displayName: id });

    const member = gymStore.members[0];
    const pay = ops.recordMemberPayment(gymStore, trainerAli, { memberId: member.id, amount: 1000, method: 'cash', description: '' });
    assert(!pay.success && pay.messageKey === 'auth.forbidden', 'trainers cannot record payments');
    assert(ops.recordMemberPayment(gymStore, owner, { memberId: member.id, amount: 1000, method: 'cash', description: '' }).success, 'owners record payments');
    assert(ops.recordMemberPayment(gymStore, owner, { memberId: member.id, amount: -5, method: 'cash', description: '' }).messageKey === 'payment.invalidAmount', 'negative payments are rejected');

    const saraSession = gymStore.todaySessions.find(s => s.trainerId === sara.id && s.status === 'scheduled');
    if (saraSession) {
      const r = ops.completeSession(gymStore, trainerAli, { sessionId: saraSession.id });
      assert(!r.success && r.messageKey === 'auth.forbidden', "a trainer cannot complete another trainer's session");
      const c = ops.cancelSession(gymStore, trainerAli, { sessionId: saraSession.id });
      assert(c.messageKey === 'auth.forbidden', "a trainer cannot cancel another trainer's session");
    } else {
      assert(false, 'fixture: Sara has a scheduled session');
    }

    const anySession = gymStore.todaySessions[0];
    const other = gymStore.members.find(m => m.id !== anySession.memberId)!;
    assert(ops.cancelSessionByMember(gymStore, memberOf(other.id), { sessionId: anySession.id }).messageKey === 'auth.forbidden', "members cannot cancel someone else's session");
    assert(ops.rescheduleSession(gymStore, memberOf(other.id), { sessionId: anySession.id, newTime: '22:00' }).messageKey === 'auth.forbidden', "members cannot move someone else's session");
    assert(ops.cancelSessionByMember(gymStore, memberOf(anySession.memberId), { sessionId: anySession.id }).messageKey !== 'auth.forbidden', 'members may act on their own session');

    assert(ops.scheduleSession(gymStore, trainerAli, { date: '1499/01/01', time: '10:00', memberId: member.id, trainerId: sara.id }).messageKey === 'auth.forbidden', 'trainers cannot book for other trainers');
    assert(ops.createTrainer(gymStore, trainerAli, { data: { name: 'x', phone: '09390000000', specialty: '', status: 'active', workingDays: [], workingHours: '', dailyCapacity: 4, sessionRate: 0 }, password: 'password-1' }).messageKey === 'auth.forbidden', 'trainers cannot create trainers');
    assert(ops.setGymDailyCapacity(gymStore, trainerAli, { date: '1499/01/01', capacity: 10 }).messageKey === 'auth.forbidden', 'trainers cannot change capacity');
    assert(ops.setGymDailyCapacity(gymStore, owner, { date: '1499/01/01', capacity: -1 }).messageKey === 'gym.invalidCapacity', 'invalid capacity is rejected');

    const saved = ops.saveProgram(gymStore, trainerAli, {
      memberId: member.id, memberName: member.name, trainerId: sara.id, trainerName: sara.name, title: 'P', days: [],
    });
    assert(saved.success && (saved.data as any)?.trainerId === ali.id, 'a trainer always saves programs under their own name');
    const saraProgram = ops.saveProgram(gymStore, owner, { memberId: member.id, memberName: member.name, trainerId: sara.id, trainerName: sara.name, title: 'S', days: [] });
    const pid = (saraProgram.data as any).id;
    assert(ops.deleteProgram(gymStore, trainerAli, { programId: pid }).messageKey === 'auth.forbidden', "a trainer cannot delete another trainer's program");

    const ex = gymStore.exercises[0];
    const upd = ops.updateExercise(gymStore, owner, { id: ex.id, updates: { id: 'hijack', isCustom: true, defaultSets: 5 } as any });
    assert(upd.success && gymStore.exercises.some(e => e.id === ex.id && e.defaultSets === 5) && !gymStore.exercises.some(e => e.id === 'hijack'), 'exercise edits cannot change id or custom flag');

    const pendingByTrainer = ops.createMemberAsTrainer(gymStore, trainerAli, { name: 'P A', phone: '09391110000', password: 'password-1' });
    assert(pendingByTrainer.success && (pendingByTrainer.data as any)?.packagePending === true, 'trainer-created athletes start pending');
    assert(ops.createMemberAsTrainer(gymStore, owner, { name: 'X', phone: '09391110001', password: 'password-1' }).messageKey === 'auth.forbidden', 'the trainer-only path rejects owners');
    const acct = gymStore.users.find(u => u.entityId === (pendingByTrainer.data as any)?.id)!;
    assert(ops.resetAccountPassword(gymStore, trainerAli, { userId: acct.id, password: 'password-2' }).messageKey === 'auth.forbidden', 'trainers cannot reset passwords');
    assert(ops.resetAccountPassword(gymStore, owner, { userId: 'u-owner', password: 'password-2' }).messageKey === 'member.notFound', "owners cannot reset another owner's password through staff tools");
  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.stack ?? e}`);
  } finally {
    Object.assign(gymStore, snapshot);
    gymStore.notify = realNotify;
  }

  return { passed, failed, errors };
}
