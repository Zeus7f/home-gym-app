/**
 * src/db/seed.ts — bun run db:seed
 *
 *   ۱. کاتالوگ سراسری حرکات (۴۱۳ حرکت) — هر بار به‌روز می‌شود
 *   ۲. حساب مدیر کل از SEED_ADMIN_PHONE و SEED_ADMIN_PASSWORD (اگر وجود نداشته باشد)
 *   ۳. با SEED_DEMO=true: باشگاه نمونه با مربیان، ورزشکاران، جلسات و پرداخت‌ها
 *      (رمز همهٔ حساب‌های نمونه: SEED_DEMO_PASSWORD)
 *
 * idempotent است: اجرای دوباره چیزی را تکراری نمی‌سازد.
 */

import 'dotenv/config';
process.env.TZ ??= 'Asia/Tehran';

import { randomUUID } from 'node:crypto';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import { closeDb, getDb, runMigrations } from './index.ts';
import * as t from './schema.ts';
import { EXERCISE_CATALOG } from '../lib/exercises/catalog';
import { INITIAL_GYM, INITIAL_USERS, emptyGymData, initialGymData } from '../lib/store/gymStore';
import { isValidMobile, normalizePhone } from '../lib/phone';
import { MIN_PASSWORD_LENGTH } from '../lib/auth/accountRules';
import { hashPassword } from '../server/auth/crypto.ts';
import { dbRole, exerciseToRow, persistDiff, stateToRows } from '../server/repository.ts';

async function seed() {
  const db = getDb();
  await runMigrations('drizzle');

  // ── ۱. کاتالوگ حرکات ──
  const rows = EXERCISE_CATALOG.map(e => exerciseToRow(e, null));
  for (let i = 0; i < rows.length; i += 200) {
    await db
      .insert(t.exercises)
      .values(rows.slice(i, i + 200))
      .onConflictDoUpdate({
        target: t.exercises.id,
        set: Object.fromEntries(
          Object.entries(getTableColumns(t.exercises))
            .filter(([k]) => k !== 'id')
            .map(([k, col]) => [k, sql.raw(`excluded."${col.name}"`)])
        ),
      });
  }
  console.log(`✓ ${rows.length} exercises in the global catalog`);

  // ── ۲. مدیر کل ──
  const adminPhone = normalizePhone(process.env.SEED_ADMIN_PHONE ?? '');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? '';
  if (adminPhone || adminPassword) {
    if (!isValidMobile(adminPhone)) throw new Error('SEED_ADMIN_PHONE must be a mobile number like 09121234567');
    if (adminPassword.length < MIN_PASSWORD_LENGTH) throw new Error(`SEED_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    const [existing] = await db.select({ id: t.users.id }).from(t.users).where(eq(t.users.username, adminPhone));
    if (existing) {
      console.log(`• super admin ${adminPhone} already exists (password unchanged)`);
    } else {
      await db.insert(t.users).values({
        id: randomUUID(),
        role: 'super_admin',
        username: adminPhone,
        phone: adminPhone,
        displayName: process.env.SEED_ADMIN_NAME ?? 'مدیر کل سامانه',
        passwordHash: await hashPassword(adminPassword),
        mustChangePassword: false,
      });
      console.log(`✓ super admin ${adminPhone} created`);
    }
  } else {
    console.log('• SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD not set — no super admin created');
  }

  // ── ۳. باشگاه نمونه ──
  if (process.env.SEED_DEMO === 'true') {
    const demoPassword = process.env.SEED_DEMO_PASSWORD ?? '';
    if (demoPassword.length < MIN_PASSWORD_LENGTH) throw new Error(`SEED_DEMO_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    const [existing] = await db.select({ id: t.gyms.id }).from(t.gyms).where(eq(t.gyms.slug, 'demo-iron-haven'));
    if (existing) {
      console.log('• demo gym already exists');
    } else {
      const data = initialGymData();
      await db.transaction(async tx => {
        const [gym] = await tx
          .insert(t.gyms)
          .values({
            name: data.gym.name,
            slug: 'demo-iron-haven',
            capacity: data.gym.capacity,
            hourlyCapacity: data.gym.hourlyCapacity ?? null,
            currency: data.gym.currency,
            noShowDeductsSession: data.gym.noShowDeductsSession,
          })
          .returning();
        const globals = new Map(EXERCISE_CATALOG.map(e => [e.id, e]));
        await persistDiff(
          tx,
          gym.id,
          // از باشگاه خالی به دادهٔ نمونه: همهٔ ردیف‌ها درج می‌شوند
          { rows: stateToRows(gym.id, emptyGymData(data.gym), globals), users: [] },
          { rows: stateToRows(gym.id, data, globals), users: [] },
          { actorId: 'seed' }
        );
        // حساب‌های نمونه (بدون مدیر کل نمونه؛ مدیر کل از متغیرهای SEED_ADMIN_* ساخته می‌شود)
        const hash = await hashPassword(demoPassword);
        for (const u of INITIAL_USERS) {
          await tx.insert(t.users).values({
            id: `${u.id}-${gym.id.slice(0, 8)}`,
            gymId: gym.id,
            role: dbRole(u.role),
            username: u.phone ?? u.username,
            phone: u.phone ?? null,
            displayName: u.displayName,
            passwordHash: hash,
            mustChangePassword: false,
            entityId: u.entityId === INITIAL_GYM.id ? gym.id : u.entityId,
          });
        }
      });
      console.log(`✓ demo gym "${data.gym.name}" with ${INITIAL_USERS.length} accounts (sign in with their phone numbers)`);
    }
  }
}

seed()
  .then(() => closeDb())
  .catch(async err => {
    console.error('Seed failed:', err);
    await closeDb();
    process.exit(1);
  });
