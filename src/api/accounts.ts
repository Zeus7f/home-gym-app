/**
 * src/api/accounts.ts
 * ساخت و مدیریت حساب‌ها بر اساس نقش — components import ONLY from here.
 *
 *   مدیر کل  → باشگاه و مدیر باشگاه        (src/api/admin.ts)
 *   مدیر     → مربی و ورزشکار (کامل)، تغییر رمز، فعال/غیرفعال
 *   مربی     → ورزشکار (فقط پروفایل؛ بسته با مدیر)
 *
 * سرور مجوز و مالکیت را دوباره بررسی می‌کند؛ رمزها فقط به‌صورت hash در PostgreSQL می‌مانند.
 */

import { gymStore, runOp } from './_client';
import { localizeOp } from './_messages';
import * as ops from '../lib/domain/operations';
import { normalizePhone } from '../lib/phone';
import type { Member, Trainer, UserAccount } from '../lib/domain/gymManagement';

type ActionResult = { success: boolean; message: string };

export type NewTrainerInput = ops.NewTrainerInput;
export type NewMemberInput = ops.NewMemberInput;

/** مدیر: مربی تازه با حساب ورود (مربی در اولین ورود رمز را عوض می‌کند) */
export async function createTrainer(data: NewTrainerInput, password: string): Promise<ActionResult & { trainer?: Trainer }> {
  const r = localizeOp(
    await runOp({ method: 'POST', path: '/api/trainers', body: { data, password } }, (s, a) => ops.createTrainer(s, a, { data, password }))
  );
  return { ...r, trainer: r.data as Trainer | undefined };
}

/** مدیر: ورزشکار تازه با بسته و حساب ورود */
export async function createMember(data: NewMemberInput, password: string): Promise<ActionResult & { member?: Member }> {
  const r = localizeOp(
    await runOp({ method: 'POST', path: '/api/members', body: { data, password } }, (s, a) => ops.createMember(s, a, { data, password }))
  );
  return { ...r, member: r.data as Member | undefined };
}

/**
 * مربی: ورزشکار تازه فقط با نام، موبایل و رمز. به همان مربی وصل می‌شود و تا
 * تعیین بسته توسط مدیر رزرو ندارد؛ مدیر اعلان «منتظر بسته» می‌گیرد.
 */
export async function createMemberAsTrainer(input: { name: string; phone: string; password: string }): Promise<ActionResult & { member?: Member }> {
  const r = localizeOp(
    await runOp({ method: 'POST', path: '/api/members', body: input }, (s, a) => ops.createMemberAsTrainer(s, a, input))
  );
  return { ...r, member: r.data as Member | undefined };
}

/** مدیر: تعیین بستهٔ ورزشکاری که مربی ساخته (یا بستهٔ تازه) */
export async function assignMemberPackage(
  memberId: string,
  pkg: Parameters<typeof gymStore.assignMemberPackage>[1]
): Promise<ActionResult> {
  return localizeOp(
    await runOp({ method: 'PUT', path: `/api/members/${encodeURIComponent(memberId)}/package`, body: pkg }, (s, a) =>
      ops.assignMemberPackage(s, a, { memberId, ...pkg })
    )
  );
}

/** حساب ورود یک مربی یا ورزشکار (فقط مدیر فهرست حساب‌ها را دارد) */
export function getAccountFor(role: 'trainer' | 'member', entityId: string): UserAccount | undefined {
  return gymStore.accountFor(role, entityId);
}

/** مدیر: تغییر رمز مربی یا ورزشکار */
export async function resetAccountPassword(userId: string, password: string): Promise<ActionResult> {
  return localizeOp(
    await runOp({ method: 'PATCH', path: `/api/accounts/${encodeURIComponent(userId)}/password`, body: { password } }, (s, a) =>
      ops.resetAccountPassword(s, a, { userId, password })
    )
  );
}

/** مدیر: فعال/غیرفعال کردن حساب مربی یا ورزشکار */
export async function setAccountActive(userId: string, active: boolean): Promise<ActionResult> {
  return localizeOp(
    await runOp({ method: 'PATCH', path: `/api/accounts/${encodeURIComponent(userId)}/status`, body: { active } }, (s, a) =>
      ops.setAccountActive(s, a, { userId, active })
    )
  );
}

/** نرمال‌سازی شمارهٔ موبایل برای نمایش در فرم */
export { normalizePhone };
