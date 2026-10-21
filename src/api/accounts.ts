/**
 * src/api/accounts.ts
 * ساخت و مدیریت حساب‌ها بر اساس نقش — components import ONLY from here.
 *
 *   مدیر کل  → باشگاه و مدیر باشگاه        (src/api/admin.ts)
 *   مدیر     → مربی و ورزشکار (کامل)، تغییر رمز، فعال/غیرفعال
 *   مربی     → ورزشکار (فقط پروفایل؛ بسته با مدیر)
 *
 * دموی محلی: همه‌چیز در استور. حالت Supabase: رکورد در استور ساخته و با
 * cloudSync ذخیره می‌شود، سپس Edge Function `manage-account` حساب Auth را می‌سازد.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import { isServerAuth } from './auth';
import { can } from '../lib/auth/permissions';
import { manageAccount } from '../lib/auth/supabaseAuth';
import { flushSync } from '../lib/data/cloudSync';
import { normalizePhone } from '../lib/phone';
import { getTodayJalaliString } from '../lib/date/jalali';
import type { Member, Trainer, UserAccount } from '../lib/domain/gymManagement';

type ActionResult = { success: boolean; message: string };

const forbidden = (): ActionResult => ({ success: false, message: translateStoreMessage('account.failed') });

/** ساخت حساب Auth برای رکوردی که همین حالا در استور ساخته شد (فقط حالت Supabase) */
async function provision(
  role: 'trainer' | 'member',
  entityId: string,
  fullName: string,
  phone: string,
  password: string
): Promise<ActionResult | null> {
  if (!isServerAuth()) return null;
  if (!(await flushSync())) return { success: false, message: translateStoreMessage('account.failed') };
  const res = await manageAccount({
    action: 'create',
    role,
    username: phone,
    phone,
    fullName,
    password,
    appEntityId: entityId,
  });
  return 'messageKey' in res ? { success: false, message: translateStoreMessage(res.messageKey) } : null;
}

export type NewTrainerInput = Omit<
  Trainer,
  'id' | 'completedSessions' | 'paidCompensation' | 'outstandingCompensation'
>;

/** مدیر: مربی تازه با حساب ورود */
export async function createTrainer(data: NewTrainerInput, password: string): Promise<ActionResult & { trainer?: Trainer }> {
  if (!can(gymStore.currentUser?.role, 'staff.manage')) return forbidden();
  const res = gymStore.addTrainer(data, password);
  if (!res.success || !res.trainer) return localizeResult(res);
  const failed = await provision('trainer', res.trainer.id, res.trainer.name, res.trainer.phone, password);
  return failed ?? { ...localizeResult(res), trainer: res.trainer };
}

export type NewMemberInput = Omit<
  Member,
  'id' | 'usedSessions' | 'remainingSessions' | 'outstandingBalance' | 'registrationDate'
>;

/** مدیر: ورزشکار تازه با بسته و حساب ورود */
export async function createMember(data: NewMemberInput, password: string): Promise<ActionResult & { member?: Member }> {
  if (!can(gymStore.currentUser?.role, 'member.package')) return forbidden();
  const res = gymStore.addMember(data, password);
  if (!res.success || !res.member) return localizeResult(res);
  const failed = await provision('member', res.member.id, res.member.name, res.member.phone, password);
  return failed ?? { ...localizeResult(res), member: res.member };
}

/**
 * مربی: ورزشکار تازه فقط با نام، موبایل و رمز. به همان مربی وصل می‌شود و تا
 * تعیین بسته توسط مدیر رزرو ندارد؛ مدیر اعلان «منتظر بسته» می‌گیرد.
 */
export async function createMemberAsTrainer(input: {
  name: string;
  phone: string;
  password: string;
}): Promise<ActionResult & { member?: Member }> {
  const user = gymStore.actingUser;
  if (user?.role !== 'trainer' || !can(user.role, 'member.create')) return forbidden();
  const trainer = gymStore.trainers.find(t => t.id === user.entityId);
  if (!trainer) return forbidden();

  const today = getTodayJalaliString();
  const res = gymStore.addMember(
    {
      name: input.name,
      phone: input.phone,
      defaultTrainerId: trainer.id,
      defaultTrainerName: trainer.name,
      packageName: '',
      totalSessions: 0,
      packagePrice: 0,
      paidAmount: 0,
      startDate: today,
      expirationDate: '',
      status: 'active',
    },
    input.password,
    { byTrainerId: trainer.id }
  );
  if (!res.success || !res.member) return localizeResult(res);
  const failed = await provision('member', res.member.id, res.member.name, res.member.phone, input.password);
  return failed ?? { ...localizeResult(res), member: res.member };
}

/** مدیر: تعیین بستهٔ ورزشکاری که مربی ساخته */
export async function assignMemberPackage(
  memberId: string,
  pkg: Parameters<typeof gymStore.assignMemberPackage>[1]
): Promise<ActionResult> {
  if (!can(gymStore.currentUser?.role, 'member.package')) return forbidden();
  return localizeResult(gymStore.assignMemberPackage(memberId, pkg));
}

/** حساب ورود یک مربی یا ورزشکار */
export function getAccountFor(role: 'trainer' | 'member', entityId: string): UserAccount | undefined {
  return gymStore.accountFor(role, entityId);
}

/** مدیر: تغییر رمز مربی یا ورزشکار */
export async function resetAccountPassword(userId: string, password: string): Promise<ActionResult> {
  if (!can(gymStore.currentUser?.role, 'staff.manage')) return forbidden();
  const res = gymStore.resetPassword(userId, password);
  if (!res.success || !isServerAuth()) return localizeResult(res);
  const cloud = await manageAccount({ action: 'set-password', userId, password });
  return 'messageKey' in cloud
    ? { success: false, message: translateStoreMessage(cloud.messageKey) }
    : localizeResult(res);
}

/** مدیر: فعال/غیرفعال کردن حساب مربی یا ورزشکار */
export async function setAccountActive(userId: string, active: boolean): Promise<ActionResult> {
  if (!can(gymStore.currentUser?.role, 'staff.manage')) return forbidden();
  if (isServerAuth()) {
    const cloud = await manageAccount({ action: 'set-active', userId, active });
    if ('messageKey' in cloud) return { success: false, message: translateStoreMessage(cloud.messageKey) };
  }
  return localizeResult(gymStore.setAccountActive(userId, active));
}

/** نرمال‌سازی شمارهٔ موبایل برای نمایش در فرم */
export { normalizePhone };
