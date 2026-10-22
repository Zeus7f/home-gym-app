/**
 * تست یکپارچهٔ API روی PostgreSQL واقعی — bun run test:api
 *
 * پیش‌نیاز: docker compose up -d db (و DATABASE_URL در .env). یک دیتابیس جدا به نام
 * homegym_test هر بار از نو ساخته می‌شود؛ دادهٔ توسعه دست نمی‌خورد.
 */

import 'dotenv/config';
process.env.TZ ??= 'Asia/Tehran';
process.env.JWT_SECRET ??= 'test-secret-'.padEnd(48, 'x');

import { Client } from 'pg';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';

const baseUrl = new URL(process.env.DATABASE_URL ?? 'postgres://homegym:homegym_dev_password@localhost:5432/homegym');
const adminUrl = new URL(baseUrl);
adminUrl.pathname = '/postgres';
const testUrl = new URL(baseUrl);
testUrl.pathname = '/homegym_test';

let passed = 0;
let failed = 0;
const errors: string[] = [];
const assert = (cond: unknown, msg: string) => {
  if (cond) passed++;
  else {
    failed++;
    errors.push(msg);
  }
};

/** کلاینت HTTP با کوکی جداگانه (هر کاربر یک مرورگر) */
class Browser {
  cookie = '';
  gymHeader = '';
  constructor(private base: string) {}
  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.cookie ? { Cookie: this.cookie } : {}),
        ...(this.gymHeader ? { 'X-Gym-Id': this.gymHeader } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.split(';')[0];
    const json: any = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }
  login(identifier: string, password: string) {
    return this.req('POST', '/api/auth/login', { identifier, password });
  }
}

async function main() {
  // ── دیتابیس تست تازه ──
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  await admin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'homegym_test' AND pid <> pg_backend_pid()`);
  await admin.query('DROP DATABASE IF EXISTS homegym_test');
  await admin.query('CREATE DATABASE homegym_test');
  await admin.end();
  process.env.DATABASE_URL = testUrl.toString();

  const { getDb, runMigrations, closeDb } = await import('../../db/index.ts');
  const t = await import('../../db/schema.ts');
  const { createApp } = await import('../app.ts');
  const { hashPassword } = await import('../auth/crypto.ts');
  const { exerciseToRow, loadGym, stateToRows } = await import('../repository.ts');
  const { EXERCISE_CATALOG } = await import('../../lib/exercises/catalog');
  const { getTodayJalaliString } = await import('../../lib/date/jalali');

  const db = getDb();
  await runMigrations('drizzle');
  await db.insert(t.exercises).values(EXERCISE_CATALOG.slice(0, 50).map(e => exerciseToRow(e, null)));
  await db.insert(t.users).values({
    id: randomUUID(),
    role: 'super_admin',
    username: '09120000099',
    phone: '09120000099',
    displayName: 'Super',
    passwordHash: await hashPassword('super-pass-1'),
  });

  const server = createApp(db, { production: false }).listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const today = getTodayJalaliString();

  try {
    // ── مدیر کل ──
    const sa = new Browser(base);
    assert((await sa.req('GET', '/api/admin/gyms')).status === 401, 'admin API needs a session');
    assert((await sa.login('09120000099', 'super-pass-1')).json.success, 'super admin signs in');
    assert((await sa.req('GET', '/api/admin/system')).json.system?.status === 'ok', 'system health is reported');
    const badGym = await sa.req('POST', '/api/admin/gyms', { name: 'A', capacity: 20, ownerName: 'O', ownerPhone: '123', ownerPassword: 'owner-pass-1' });
    assert(badGym.status === 422 && badGym.json.messageKey === 'account.invalidPhone', 'invalid owner phone is rejected');
    const gymA = await sa.req('POST', '/api/admin/gyms', { name: 'Gym A', capacity: 20, ownerName: 'Owner A', ownerPhone: '+98 912 100 0001', ownerPassword: 'owner-temp-1' });
    assert(gymA.status === 201, 'super admin creates gym A with its owner');
    const gymAId = gymA.json.gymId;
    const gymB = await sa.req('POST', '/api/admin/gyms', { name: 'Gym B', capacity: 10, ownerName: 'Owner B', ownerPhone: '09121000002', ownerPassword: 'owner-temp-2' });
    const gymBId = gymB.json.gymId;
    assert((await sa.req('GET', '/api/admin/gyms')).json.gyms?.length === 2, 'gym list shows both gyms');

    // ── مدیر A: تغییر رمز اجباری ──
    const ownerA = new Browser(base);
    const first = await ownerA.login('09121000001', 'owner-temp-1');
    assert(first.json.mustChangePassword === true, 'first sign-in requires a password change');
    const blocked = await ownerA.req('GET', '/api/gym/snapshot');
    assert(blocked.status === 403 && blocked.json.messageKey === 'auth.passwordChangeRequired', 'data is locked until the password is changed');
    assert((await ownerA.req('POST', '/api/auth/change-password', { currentPassword: 'nope', newPassword: 'owner-pass-1' })).json.messageKey === 'auth.wrongCurrentPassword', 'wrong current password is rejected');
    assert((await ownerA.req('POST', '/api/auth/change-password', { currentPassword: 'owner-temp-1', newPassword: 'owner-pass-1' })).json.success, 'owner changes the temporary password');
    const emptySnap = await ownerA.req('GET', '/api/gym/snapshot');
    assert(emptySnap.status === 200 && emptySnap.json.snapshot.trainers.length === 0, 'new gym starts empty');

    // ── مدیر A: مربی و ورزشکار ──
    const trainerRes = await ownerA.req('POST', '/api/trainers', {
      data: { name: 'Coach A', phone: '09122000001', specialty: 'Strength', workingDays: ['Saturday'], workingHours: '09:00 - 15:00', dailyCapacity: 6, sessionRate: 100000 },
      password: 'coach-temp-1',
    });
    assert(trainerRes.json.success, 'owner creates a trainer');
    const coachId = trainerRes.json.data.id;
    const [coachUser] = await db.select().from(t.users).where(eq(t.users.username, '09122000001'));
    assert(coachUser && !coachUser.passwordHash.includes('coach-temp-1') && coachUser.mustChangePassword, 'trainer password is hashed and must be changed');

    const memberRes = await ownerA.req('POST', '/api/members', {
      data: { name: 'Athlete One', phone: '09123000001', defaultTrainerId: coachId, packageName: 'Gold', totalSessions: 10, packagePrice: 5000000, paidAmount: 2000000, startDate: today, expirationDate: '1499/12/29' },
      password: 'member-temp-1',
    });
    assert(memberRes.json.success, 'owner creates an athlete with a package');
    const athleteId = memberRes.json.data.id;

    // موبایل تکراری در باشگاه دیگر
    const ownerB = new Browser(base);
    await ownerB.login('09121000002', 'owner-temp-2');
    await ownerB.req('POST', '/api/auth/change-password', { currentPassword: 'owner-temp-2', newPassword: 'owner-pass-2' });
    const dupe = await ownerB.req('POST', '/api/trainers', {
      data: { name: 'Dup', phone: '09122000001', specialty: '', workingDays: [], workingHours: '', dailyCapacity: 6, sessionRate: 0 },
      password: 'dupe-pass-1',
    });
    assert(dupe.status === 409 && dupe.json.messageKey === 'account.phoneTaken', 'a phone number belongs to one account across all gyms');
    assert((await ownerB.req('GET', '/api/gym/snapshot')).json.snapshot.trainers.length === 0, 'failed request leaves no partial data (transaction rolled back)');

    // ── مربی ──
    const coach = new Browser(base);
    await coach.login('09122000001', 'coach-temp-1');
    await coach.req('POST', '/api/auth/change-password', { currentPassword: 'coach-temp-1', newPassword: 'coach-pass-1' });
    const coachSnap = (await coach.req('GET', '/api/gym/snapshot')).json.snapshot;
    assert(coachSnap.memberPayments.length === 0 && coachSnap.users.length === 0, 'trainers do not receive payments or accounts');
    assert(coachSnap.members.every((m: any) => m.packagePrice === 0 && m.outstandingBalance === 0), 'trainers do not see athletes’ money');
    assert((await coach.req('POST', `/api/members/${athleteId}/payments`, { amount: 1000, method: 'cash' })).status === 403, 'trainers cannot record payments');
    assert((await coach.req('GET', '/api/admin/gyms')).status === 403, 'trainers cannot reach the admin API');
    assert((await coach.req('PUT', '/api/gym/capacity', { date: today, capacity: 1 })).status === 403, 'trainers cannot change capacity');

    const pending = await coach.req('POST', '/api/members', { name: 'Pending Two', phone: '09123000002', password: 'member-temp-2', packagePrice: 999 });
    assert(pending.json.success && pending.json.data.packagePending === true && pending.json.data.packagePrice === 0, 'trainer creates a pending athlete without price');
    const pendingId = pending.json.data.id;
    const pendingBook = await coach.req('POST', '/api/sessions', { date: today, time: '20:00', memberId: pendingId, trainerId: coachId });
    assert(pendingBook.status === 422 && pendingBook.json.messageKey === 'session.packagePending', 'pending athletes cannot be booked');
    const notes = (await ownerA.req('GET', '/api/gym/notifications?lang=en')).json.notifications ?? [];
    assert(notes.some((n: any) => n.kind === 'package_pending'), 'owner is notified about the pending athlete');
    assert((await ownerA.req('PUT', `/api/members/${pendingId}/package`, { packageName: 'Silver', totalSessions: 8, packagePrice: 3000000, paidAmount: 0, startDate: today, expirationDate: '1499/12/29' })).json.success, 'owner sets the package');

    // ── نوبت و ثبت جلسه ──
    const booked = await coach.req('POST', '/api/sessions', { date: today, time: '21:00', memberId: athleteId, trainerId: coachId });
    assert(booked.json.success, 'trainer books an athlete');
    const sessionId = booked.json.data.id;
    assert((await coach.req('POST', '/api/sessions', { date: today, time: '21:00', memberId: athleteId, trainerId: coachId })).json.messageKey === 'session.duplicateSlot', 'server enforces booking rules (duplicate slot)');

    // هم‌زمانی: سه درخواست تکمیل هم‌زمان فقط یک جلسه کسر می‌کنند
    const results = await Promise.all([1, 2, 3].map(() => coach.req('POST', `/api/sessions/${sessionId}/complete`, { exercises: [] })));
    assert(results.every(r => r.json.success), 'parallel completions all succeed (idempotent)');
    const [athleteRow] = await db.select().from(t.members).where(eq(t.members.id, athleteId));
    assert(athleteRow.usedSessions === 1 && athleteRow.remainingSessions === 9, 'exactly one session is deducted under concurrency');
    const [coachRow] = await db.select().from(t.trainers).where(eq(t.trainers.id, coachId));
    assert(coachRow.completedSessions === 1 && coachRow.outstandingCompensation === 100000, 'trainer pay is credited once');

    // ── ورزشکار ──
    const athlete = new Browser(base);
    await athlete.login('09123000002', 'member-temp-2');
    await athlete.req('POST', '/api/auth/change-password', { currentPassword: 'member-temp-2', newPassword: 'member-pass-2' });
    const mySnap = (await athlete.req('GET', '/api/gym/snapshot')).json.snapshot;
    assert(mySnap.members.length === 1 && mySnap.members[0].id === pendingId, 'athletes only receive their own record');
    assert(mySnap.todaySessions.every((s: any) => s.memberId === pendingId), 'athletes only receive their own sessions');
    assert((await athlete.req('POST', `/api/sessions/${sessionId}/member-cancel`, {})).status === 403, "athletes cannot cancel someone else's session");
    assert((await athlete.req('POST', '/api/trainers', { data: {}, password: 'x' })).status === 403, 'athletes cannot create trainers');

    // ── جداسازی باشگاه‌ها ──
    const bSnap = (await ownerB.req('GET', '/api/gym/snapshot')).json.snapshot;
    assert(bSnap.members.length === 0 && bSnap.todaySessions.length === 0, "gym B sees none of gym A's data");
    const crossGym = await ownerB.req('POST', `/api/sessions/${sessionId}/cancel`, {});
    assert(crossGym.status === 404, "gym B cannot touch gym A's sessions");

    // ── باطل شدن نشست ──
    const coachUserId = coachUser.id;
    assert((await ownerA.req('PATCH', `/api/accounts/${coachUserId}/password`, { password: 'coach-reset-1' })).json.success, 'owner resets the trainer password');
    assert((await coach.req('GET', '/api/gym/snapshot')).status === 401, 'old trainer session is revoked after a password reset');
    const forged = new Browser(base);
    forged.cookie = coach.cookie.replace(/.$/, c => (c === 'a' ? 'b' : 'a'));
    assert((await forged.req('GET', '/api/auth/me')).status === 401, 'tampered session cookie is rejected');

    // ── مدیر کل وارد باشگاه می‌شود ──
    sa.gymHeader = gymAId;
    const saSnap = await sa.req('GET', '/api/gym/snapshot');
    assert(saSnap.status === 200 && saSnap.json.snapshot.members.length === 2, 'super admin can open a gym panel');

    // ── نگاشت پایدار: آنچه بار می‌شود همان است که در دیتابیس هست ──
    const loaded = await loadGym(db, gymAId);
    const rows = stateToRows(gymAId, loaded!.state, loaded!.globalExercises);
    const dbMembers = await db.select().from(t.members).where(eq(t.members.gymId, gymAId));
    const dbSessions = await db.select().from(t.sessions).where(inArray(t.sessions.id, rows.sessions.map(r => String(r.id))));
    assert(rows.members.length === dbMembers.length && rows.sessions.length === dbSessions.length, 'load → rows covers every stored row');
    const sameMember = dbMembers.every(m => {
      const r = rows.members.find(x => x.id === m.id)!;
      return Object.keys(r).every(k => JSON.stringify((m as any)[k] ?? null) === JSON.stringify(r[k] ?? null));
    });
    assert(sameMember, 'member rows round-trip without changes (no phantom writes)');

    // ── غیرفعال‌سازی باشگاه ──
    assert((await sa.req('PATCH', `/api/admin/gyms/${gymAId}`, { isActive: false })).json.success, 'super admin deactivates gym A');
    assert((await ownerA.req('GET', '/api/auth/me')).status === 403, 'deactivated gym blocks existing sessions');
    assert((await new Browser(base).login('09121000001', 'owner-pass-1')).json.messageKey === 'login.gymInactive', 'deactivated gym blocks sign-in');

    // ── محدودیت تلاش ورود ──
    const attacker = new Browser(base);
    let last = 0;
    for (let i = 0; i < 9; i++) last = (await attacker.login('09121000002', `wrong-${i}`)).status;
    assert(last === 429, 'repeated wrong passwords are rate limited');
  } catch (e: any) {
    failed++;
    errors.push(`Unexpected error: ${e?.stack ?? e}`);
  } finally {
    server.close();
    await closeDb();
  }

  console.log(`--- API integration tests ---\nPassed: ${passed}\nFailed: ${failed}`);
  if (failed) {
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  process.exit(0);
}

main();
