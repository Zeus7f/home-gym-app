/**
 * src/api/admin.ts
 * پنل مدیر کل سامانه: باشگاه‌ها، مدیران و وضعیت سامانه — components import ONLY from here.
 */

import { apiRequest, gymStore, refreshSnapshot } from './_client';
import { translateStoreMessage } from './_messages';
import type { Gym, UserAccount } from '../lib/domain/gymManagement';
import type { StoreMessageKey, StoreMessageParams } from '../lib/domain/storeMessages';

type ActionResult = { success: boolean; message: string };

export interface GymSummary {
  gym: Gym;
  trainers: number;
  members: number;
  owner?: UserAccount;
}

export interface SystemStatus {
  status: string;
  uptimeSeconds: number;
  dbLatencyMs: number;
  node: string;
  timezone: string;
  counts: { gyms: number; users: number; sessions: number };
}

type Reply = { success: boolean; messageKey: StoreMessageKey; params?: StoreMessageParams };
const toResult = (j: Reply): ActionResult => ({
  success: !!j.success,
  message: translateStoreMessage(j.messageKey ?? 'server.unavailable', j.params),
});

export async function listGyms(): Promise<GymSummary[]> {
  const { json } = await apiRequest<{ gyms?: GymSummary[] }>('GET', '/api/admin/gyms');
  return json.gyms ?? [];
}

export async function listOwnerAccounts(): Promise<UserAccount[]> {
  const { json } = await apiRequest<{ accounts?: UserAccount[] }>('GET', '/api/admin/accounts');
  return json.accounts ?? [];
}

export async function getSystemStatus(): Promise<SystemStatus | null> {
  const { json } = await apiRequest<{ system?: SystemStatus }>('GET', '/api/admin/system');
  return json.system ?? null;
}

export interface NewGymInput {
  name: string;
  capacity: number;
  ownerName: string;
  ownerPhone: string;
  ownerPassword: string;
}

/** باشگاه تازه به‌همراه حساب مدیر آن */
export async function createGym(input: NewGymInput): Promise<ActionResult> {
  const { json } = await apiRequest<Reply>('POST', '/api/admin/gyms', input);
  return toResult(json);
}

export async function setGymActive(gymId: string, active: boolean): Promise<ActionResult> {
  const { json } = await apiRequest<Reply>('PATCH', `/api/admin/gyms/${encodeURIComponent(gymId)}`, { isActive: active });
  return toResult(json);
}

/** مدیر کل: تعیین رمز تازه برای مدیر یک باشگاه (در ورود بعدی باید عوضش کند) */
export async function resetOwnerPassword(userId: string, password: string): Promise<ActionResult> {
  const { json } = await apiRequest<Reply>('POST', `/api/admin/accounts/${encodeURIComponent(userId)}/password`, { password });
  return toResult(json);
}

/** مدیر کل: ورود به پنل یک باشگاه با اختیارات مدیر همان باشگاه */
export async function enterGym(gymId: string): Promise<boolean> {
  gymStore.adminGymId = gymId;
  const ok = await refreshSnapshot();
  if (!ok) gymStore.adminGymId = null;
  gymStore.notify();
  return ok;
}

/** خروج مدیر کل از پنل باشگاه */
export function leaveGym() {
  gymStore.adminGymId = null;
  gymStore.notify();
}
