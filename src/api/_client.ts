/**
 * src/api/_client.ts
 * ارتباط با سرور (Express + PostgreSQL).
 *
 * در مرورگر هر تغییر داده یک درخواست REST است. سرور عملیات را اعتبارسنجی و ذخیره می‌کند
 * و دادهٔ تازهٔ باشگاه را برمی‌گرداند؛ استور مرورگر (gymStore) فقط کش خواندنی همان داده است.
 * بیرون از مرورگر (تست‌های واحد) همان عملیات (operations.ts) روی استور محلی اجرا می‌شود.
 */

import { gymStore } from '../lib/store/gymStore';
import type { UserAccount } from '../lib/store/gymStore';
import type { OpResult } from '../lib/domain/operations';
import type { GymSnapshot, OpResponse } from '../lib/data/snapshot';
import type { StoreMessageKey } from '../lib/domain/storeMessages';

/** آیا داده از سرور می‌آید؟ (در تست‌های واحد، موتور محلی) */
export const isRemote = (): boolean => typeof window !== 'undefined' && typeof fetch === 'function';

export { gymStore };

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** پاسخ خام API به‌همراه کد وضعیت */
export async function apiRequest<T = Record<string, unknown>>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<{ status: number; json: T & Partial<OpResponse> }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // مدیر کل داخل پنل یک باشگاه
  if (gymStore.adminGymId && gymStore.currentUser?.role === 'super_admin') headers['X-Gym-Id'] = gymStore.adminGymId;

  try {
    const res = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({ success: false, messageKey: 'server.unavailable' }))) as T & Partial<OpResponse>;
    if (res.status === 401 && gymStore.currentUser) {
      // نشست باطل شده (خروج از دستگاه دیگر، تغییر رمز، غیرفعال‌سازی)
      gymStore.logout();
    }
    if (res.status === 403 && json.messageKey === 'auth.passwordChangeRequired') {
      gymStore.mustChangePassword = true;
      gymStore.notify();
    }
    return { status: res.status, json };
  } catch {
    return { status: 0, json: { success: false, messageKey: 'server.unavailable' } as T & Partial<OpResponse> };
  }
}

/** دادهٔ تازهٔ باشگاه را در کش مرورگر می‌نشاند */
export function applySnapshot(snapshot: GymSnapshot | undefined) {
  if (snapshot) gymStore.applySnapshot(snapshot);
}

/** هویت عملیات در موتور محلی (تست‌ها): کاربر واردشده، وگرنه مدیر باشگاه نمونه */
const LOCAL_OWNER: UserAccount = { id: 'local-owner', username: 'local', password: '', role: 'owner', entityId: 'gym-1', displayName: 'Local owner' };

/**
 * اجرای یک عملیات تغییر داده: در مرورگر از راه REST، در تست‌ها روی استور محلی.
 */
export async function runOp<T>(
  remote: { method: HttpMethod; path: string; body?: unknown },
  local: (store: typeof gymStore, actor: UserAccount) => OpResult<T>
): Promise<OpResult<T>> {
  if (!isRemote()) {
    const result = local(gymStore, gymStore.currentUser ?? LOCAL_OWNER);
    if (result.success) gymStore.notify();
    return result;
  }
  const { json } = await apiRequest<OpResponse<T>>(remote.method, remote.path, remote.body);
  applySnapshot(json.snapshot);
  return {
    success: !!json.success,
    messageKey: (json.messageKey ?? 'server.unavailable') as StoreMessageKey,
    params: json.params,
    data: json.data as T | undefined,
  };
}

/** دادهٔ تازهٔ باشگاه از سرور */
export async function refreshSnapshot(): Promise<boolean> {
  if (!isRemote()) return true;
  const { status, json } = await apiRequest<OpResponse>('GET', '/api/gym/snapshot');
  if (status !== 200 || !json.snapshot) return false;
  applySnapshot(json.snapshot);
  return true;
}

/** True when data is loaded from and saved to the server. */
export const isLiveBackend = (): boolean => isRemote();
