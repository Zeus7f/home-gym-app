/**
 * src/api/auth.ts
 * Authentication & session API — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import type { UserAccount } from '../lib/domain/gymManagement';
import * as supabaseAuth from '../lib/auth/supabaseAuth';
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '../lib/auth/accountMapping';

/**
 * هویت داده‌ای فعال برای صفحات.
 * B-07: در حالت پیش‌نمایش مدیر، کاربر پیش‌نمایش برگردانده می‌شود تا داده‌ها
 * با همان هویتی خوانده شوند که پوستهٔ UI نمایش می‌دهد.
 */
export function getCurrentUser(): UserAccount | null {
  return gymStore.actingUser;
}

/** کاربر واقعیِ واردشده (بدون در نظر گرفتن پیش‌نمایش). */
export function getAuthenticatedUser(): UserAccount | null {
  return gymStore.currentUser;
}

/** آیا ورود از Supabase Auth است؟ (در غیر این صورت دموی محلی) */
export function isServerAuth(): boolean {
  return gymStore.authMode === 'supabase';
}

/** آیا وضعیت نشست مشخص شده است؟ تا آن موقع صفحهٔ ورود نباید نمایش داده شود. */
export function isAuthReady(): boolean {
  return gymStore.authReady;
}

/**
 * B-01: بازیابی نشست Supabase هنگام بارگذاری و همگام ماندن با خروج در تب‌های دیگر.
 * @returns تابع لغو اشتراک
 */
export function initAuth(): () => void {
  if (!isServerAuth()) return () => {};
  supabaseAuth
    .restoreSession(gymStore.gym.id)
    .then(user => gymStore.setAuthenticatedUser(user))
    .catch(() => gymStore.setAuthenticatedUser(null));
  return supabaseAuth.onSignedOut(() => {
    if (gymStore.currentUser) gymStore.setAuthenticatedUser(null);
  });
}

/** ورود با نام کاربری و کلمه عبور. */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!isServerAuth()) return localizeResult(gymStore.login(username, password));

  const outcome = await supabaseAuth.signIn(username, password, gymStore.gym.id);
  if ('messageKey' in outcome) {
    return { success: false, message: translateStoreMessage(outcome.messageKey) };
  }
  gymStore.setAuthenticatedUser(outcome.user);
  return { success: true, message: translateStoreMessage('login.success') };
}

/** خروج از حساب کاربری. */
export async function logout(): Promise<void> {
  gymStore.logout();
  if (isServerAuth()) await supabaseAuth.signOut();
}

/** انتخاب کاربر فعال (برای تعویض نقش در حالت دمو). */
export async function setCurrentUser(userId: string): Promise<void> {
  gymStore.setCurrentUser(userId);
}

/**
 * B-01: ساخت حساب ورود برای مربی یا عضو (فقط مدیر باشگاه).
 * در حالت Supabase رمز به Edge Function manage-account می‌رود و در مرورگر ذخیره نمی‌شود.
 * در دموی محلی حساب قبلاً با addTrainer/addMember در استور ساخته شده است.
 */
export async function createLoginAccount(input: {
  role: 'trainer' | 'member';
  entityId: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!isServerAuth()) {
    return { success: true, message: translateStoreMessage('account.created') };
  }
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    return { success: false, message: translateStoreMessage('account.invalidUsername') };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, message: translateStoreMessage('account.weakPassword') };
  }
  const result = await supabaseAuth.provisionAccount({
    username,
    password: input.password,
    fullName: input.fullName,
    role: input.role,
    appEntityId: input.entityId,
    phone: input.phone,
  });
  return 'messageKey' in result
    ? { success: false, message: translateStoreMessage(result.messageKey) }
    : { success: true, message: translateStoreMessage('account.created') };
}

/**
 * اشتراک در تغییرات استور.
 * هر تغییری در داده‌ها (ثبت جلسه، لغو نوبت، انتشار برنامه و …) فراخوانی می‌شود.
 */
export function subscribeToStore(fn: () => void): () => void {
  return gymStore.subscribe(fn);
}
