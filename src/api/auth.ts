/**
 * src/api/auth.ts
 * Authentication & session API — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult } from './_messages';
import type { UserAccount } from '../lib/domain/gymManagement';

/** کاربر واردشده فعلی (یا null اگر وارد نشده باشد). */
export function getCurrentUser(): UserAccount | null {
  return gymStore.currentUser;
}

/** ورود با نام کاربری و کلمه عبور. */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  return localizeResult(gymStore.login(username, password));
}

/** خروج از حساب کاربری. */
export async function logout(): Promise<void> {
  gymStore.logout();
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
