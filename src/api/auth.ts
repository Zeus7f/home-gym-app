/**
 * src/api/auth.ts
 * Authentication & session API — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import type { UserAccount } from '../lib/domain/gymManagement';
import * as supabaseAuth from '../lib/auth/supabaseAuth';
import { openGym, stopSync } from '../lib/data/cloudSync';

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
 * پس از تأیید هویت در حالت Supabase: دادهٔ باشگاه کاربر از ابر بار می‌شود.
 * مدیر کل باشگاه ندارد و فهرست باشگاه‌ها را در پنل خودش می‌خواند.
 */
async function enterSession(user: UserAccount | null): Promise<{ success: boolean; message?: string }> {
  if (!user) {
    stopSync();
    gymStore.setAuthenticatedUser(null);
    return { success: false };
  }
  if (user.gymId) {
    const error = await openGym(user.gymId);
    if (error) {
      await supabaseAuth.signOut();
      gymStore.setAuthenticatedUser(null);
      return { success: false, message: translateStoreMessage('login.authUnavailable') };
    }
  }
  gymStore.setAuthenticatedUser(user);
  return { success: true, message: translateStoreMessage('login.success') };
}

/**
 * B-01: بازیابی نشست Supabase هنگام بارگذاری و همگام ماندن با خروج در تب‌های دیگر.
 * @returns تابع لغو اشتراک
 */
export function initAuth(): () => void {
  if (!isServerAuth()) return () => {};
  supabaseAuth
    .restoreSession()
    .then(user => enterSession(user))
    .catch(() => enterSession(null));
  return supabaseAuth.onSignedOut(() => {
    if (gymStore.currentUser) void enterSession(null);
  });
}

/** ورود با شمارهٔ موبایل (یا نام کاربری) و کلمه عبور. */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!isServerAuth()) return localizeResult(gymStore.login(username, password));

  const outcome = await supabaseAuth.signIn(username, password);
  if ('messageKey' in outcome) {
    return { success: false, message: translateStoreMessage(outcome.messageKey) };
  }
  return enterSession(outcome.user);
}

/** خروج از حساب کاربری. */
export async function logout(): Promise<void> {
  stopSync();
  gymStore.logout();
  if (isServerAuth()) await supabaseAuth.signOut();
}

/** انتخاب کاربر فعال (برای تعویض نقش در حالت دمو). */
export async function setCurrentUser(userId: string): Promise<void> {
  gymStore.setCurrentUser(userId);
}

/**
 * اشتراک در تغییرات استور.
 * هر تغییری در داده‌ها (ثبت جلسه، لغو نوبت، انتشار برنامه و …) فراخوانی می‌شود.
 */
export function subscribeToStore(fn: () => void): () => void {
  return gymStore.subscribe(fn);
}
