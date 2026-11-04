/**
 * src/api/auth.ts
 * Authentication & session API — components import ONLY from here.
 * نشست با کوکی HttpOnly سرور مدیریت می‌شود؛ مرورگر هیچ توکن یا رمزی نگه نمی‌دارد.
 */

import { apiRequest, gymStore, isRemote, refreshSnapshot } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import { loadExerciseCatalog } from '../lib/exercises/catalog';
import type { RoleOption, UserAccount } from '../lib/domain/gymManagement';
import type { StoreMessageKey } from '../lib/domain/storeMessages';

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

/** آیا وضعیت نشست مشخص شده است؟ تا آن موقع صفحهٔ ورود نباید نمایش داده شود. */
export function isAuthReady(): boolean {
  return gymStore.authReady;
}

/** کاربر باید پیش از ادامه رمز تازه انتخاب کند */
export function mustChangePassword(): boolean {
  return gymStore.mustChangePassword;
}

interface SessionPayload {
  user: UserAccount;
  mustChangePassword: boolean;
  /** همهٔ نقش‌های این هویت؛ بیش از یکی یعنی امکان تعویض نقش هست */
  roles?: RoleOption[];
}

/** پس از ورود یا بازیابی نشست: کاربر و دادهٔ باشگاهش */
async function enterSession(payload: SessionPayload | null): Promise<boolean> {
  if (!payload) {
    gymStore.setAuthenticatedUser(null);
    return false;
  }
  gymStore.mustChangePassword = payload.mustChangePassword;
  gymStore.currentUser = payload.user;
  gymStore.availableRoles = payload.roles ?? [];
  // مدیر کل باشگاه ندارد؛ با تغییر رمز اجباری هنوز به دادهٔ باشگاه دسترسی نیست
  if (payload.user.gymId && !payload.mustChangePassword && !(await refreshSnapshot())) {
    gymStore.setAuthenticatedUser(null);
    return false;
  }
  gymStore.setAuthenticatedUser(payload.user);
  return true;
}

/** بازیابی نشست هنگام بارگذاری صفحه. @returns تابع لغو (برای useEffect) */
export function initAuth(): () => void {
  if (!isRemote()) {
    gymStore.authReady = true;
    return () => {};
  }
  let cancelled = false;
  // کاتالوگ حرکات چانک جداست و هم‌زمان با نشست گرفته می‌شود؛ صفحات آن را
  // هم‌زمان (sync) می‌خوانند، پس باید پیش از نخستین رندر آماده باشد.
  Promise.all([apiRequest<SessionPayload>('GET', '/api/auth/me'), loadExerciseCatalog()]).then(([{ status, json }]) => {
    if (cancelled) return;
    void enterSession(status === 200 ? json : null);
  });
  return () => {
    cancelled = true;
  };
}

/** ورود با شمارهٔ موبایل (یا نام کاربری) و کلمه عبور. */
export async function login(
  identifier: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!isRemote()) return localizeResult(gymStore.login(identifier, password));

  const { json } = await apiRequest<SessionPayload & { success: boolean; messageKey: StoreMessageKey }>(
    'POST',
    '/api/auth/login',
    { identifier, password }
  );
  if (!json.success) {
    return { success: false, message: translateStoreMessage(json.messageKey ?? 'server.unavailable') };
  }
  const ok = await enterSession(json);
  return {
    success: ok,
    message: translateStoreMessage(ok ? 'login.success' : 'server.unavailable'),
  };
}

/** نقش‌های این هویت — بیش از یکی یعنی کاربر می‌تواند نقش فعال را عوض کند. */
export function getAvailableRoles(): RoleOption[] {
  return gymStore.availableRoles;
}

/**
 * تعویض نقش فعال بدون ورود دوباره.
 * نشست سرور عوض می‌شود، پس دادهٔ باشگاه هم با هویت تازه دوباره خوانده می‌شود.
 */
export async function switchRole(roleId: string): Promise<{ success: boolean; message: string }> {
  const { json } = await apiRequest<SessionPayload & { success: boolean; messageKey: StoreMessageKey }>(
    'POST',
    '/api/auth/switch-role',
    { roleId }
  );
  if (!json.success) return { success: false, message: translateStoreMessage(json.messageKey ?? 'server.unavailable') };
  // پیش‌نمایش نقش مدیر با تعویض نقش واقعی جمع می‌شود
  gymStore.setPreviewUser(null);
  const ok = await enterSession(json);
  return { success: ok, message: translateStoreMessage(ok ? 'auth.roleSwitched' : 'server.unavailable') };
}

/** تغییر رمز خود کاربر (و پایان «تغییر رمز اجباری») */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const { json } = await apiRequest<{ success: boolean; messageKey: StoreMessageKey }>(
    'POST',
    '/api/auth/change-password',
    { currentPassword, newPassword }
  );
  if (!json.success) return { success: false, message: translateStoreMessage(json.messageKey ?? 'server.unavailable') };
  gymStore.mustChangePassword = false;
  if (gymStore.currentUser?.gymId) await refreshSnapshot();
  gymStore.notify();
  return { success: true, message: translateStoreMessage('account.passwordChanged') };
}

/** خروج از حساب کاربری. */
export async function logout(): Promise<void> {
  if (isRemote()) await apiRequest('POST', '/api/auth/logout');
  gymStore.logout();
}

/**
 * اشتراک در تغییرات استور.
 * هر تغییری در داده‌ها (ثبت جلسه، لغو نوبت، انتشار برنامه و …) فراخوانی می‌شود.
 */
export function subscribeToStore(fn: () => void): () => void {
  return gymStore.subscribe(fn);
}
