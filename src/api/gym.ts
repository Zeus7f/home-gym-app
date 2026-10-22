/**
 * src/api/gym.ts
 * Gym-level data (name, capacity, audit log).
 */

import { gymStore } from './_client';
import { localizeOp } from './_messages';
import { runOp } from './_client';
import * as ops from '../lib/domain/operations';
import type { Gym } from '../lib/domain/gymManagement';

/** Get current gym settings. */
export async function getGym(): Promise<Gym> {
  return gymStore.gym;
}

/** نام باشگاه فعال (هم‌زمان، برای پوسته) */
export function getGymName(): string {
  return gymStore.gym.name;
}

/**
 * ذخیرهٔ تنظیمات عملیاتی باشگاه (B-13).
 * ظرفیت روزانه و هم‌زمان بلافاصله در قوانین رزرو اعمال می‌شوند.
 */
export async function updateGymSettings(
  patch: Partial<Pick<Gym, 'capacity' | 'hourlyCapacity' | 'noShowDeductsSession' | 'name'>>
): Promise<{ success: boolean; message: string }> {
  return localizeOp(
    await runOp({ method: 'PATCH', path: '/api/gym/settings', body: patch }, (s, a) => ops.updateGymSettings(s, a, patch))
  );
}
