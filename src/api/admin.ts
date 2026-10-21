/**
 * src/api/admin.ts
 * پنل مدیر کل سامانه: باشگاه‌ها و مدیرانشان — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import { isServerAuth } from './auth';
import { can } from '../lib/auth/permissions';
import { manageAccount } from '../lib/auth/supabaseAuth';
import { listGyms as listCloudGyms, openGym, setGymActiveInCloud, type GymSummary } from '../lib/data/cloudSync';
import { normalizePhone, isValidMobile } from '../lib/phone';
import { MIN_PASSWORD_LENGTH } from '../lib/auth/accountMapping';

type ActionResult = { success: boolean; message: string };

const isAdmin = () => can(gymStore.currentUser?.role, 'gym.manage');
const denied = (): ActionResult => ({ success: false, message: translateStoreMessage('account.failed') });

export type { GymSummary };

export async function listGyms(): Promise<GymSummary[]> {
  if (!isAdmin()) return [];
  return isServerAuth() ? listCloudGyms() : gymStore.gymSummaries();
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
  if (!isAdmin()) return denied();
  if (!isServerAuth()) return localizeResult(gymStore.createGym(input));

  // همان اعتبارسنجی دمو، پیش از تماس با سرور
  const phone = normalizePhone(input.ownerPhone);
  if (!input.name.trim()) return { success: false, message: translateStoreMessage('gym.invalidName') };
  if (!input.ownerName.trim()) return { success: false, message: translateStoreMessage('account.invalidName') };
  if (!isValidMobile(phone)) return { success: false, message: translateStoreMessage('account.invalidPhone') };
  if (input.ownerPassword.trim().length < MIN_PASSWORD_LENGTH) {
    return { success: false, message: translateStoreMessage('account.weakPassword') };
  }
  const res = await manageAccount({
    action: 'create-gym',
    gymName: input.name.trim(),
    capacity: Math.round(input.capacity),
    fullName: input.ownerName.trim(),
    username: phone,
    phone,
    password: input.ownerPassword.trim(),
  });
  return 'messageKey' in res
    ? { success: false, message: translateStoreMessage(res.messageKey) }
    : { success: true, message: translateStoreMessage('gym.created', { gym: input.name.trim() }) };
}

export async function setGymActive(gymId: string, active: boolean): Promise<ActionResult> {
  if (!isAdmin()) return denied();
  if (isServerAuth() && !(await setGymActiveInCloud(gymId, active))) {
    return { success: false, message: translateStoreMessage('account.failed') };
  }
  return localizeResult(gymStore.setGymActive(gymId, active));
}

/** مدیر کل: تغییر رمز مدیر یک باشگاه */
export async function resetOwnerPassword(userId: string, password: string): Promise<ActionResult> {
  if (!isAdmin()) return denied();
  if (!isServerAuth()) return localizeResult(gymStore.resetPassword(userId, password));
  if (password.trim().length < MIN_PASSWORD_LENGTH) {
    return { success: false, message: translateStoreMessage('account.weakPassword') };
  }
  const res = await manageAccount({ action: 'set-password', userId, password: password.trim() });
  return 'messageKey' in res
    ? { success: false, message: translateStoreMessage(res.messageKey) }
    : { success: true, message: translateStoreMessage('account.passwordChanged') };
}

/**
 * مدیر کل: ورود به پنل یک باشگاه (پیش‌نمایش با هویت مدیر همان باشگاه).
 * @returns شناسهٔ حساب مدیر برای پیش‌نمایش، یا null
 */
export async function enterGym(gymId: string): Promise<boolean> {
  if (!isAdmin()) return false;
  if (isServerAuth() && (await openGym(gymId)) !== null) return false;
  if (!isServerAuth()) gymStore.activateGym(gymId);
  gymStore.adminGymId = gymId;
  gymStore.notify();
  return true;
}
