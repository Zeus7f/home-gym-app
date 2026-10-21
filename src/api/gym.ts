/**
 * src/api/gym.ts
 * Gym-level data (name, capacity, audit log).
 */

import { gymStore } from './_client';
import { localizeResult } from './_messages';
import type { Gym } from '../lib/domain/gymManagement';

/** Get current gym settings. */
export async function getGym(): Promise<Gym> {
  return gymStore.gym;
}

/**
 * ذخیرهٔ تنظیمات عملیاتی باشگاه (B-13).
 * ظرفیت روزانه و هم‌زمان بلافاصله در قوانین رزرو اعمال می‌شوند.
 */
export async function updateGymSettings(
  patch: Partial<Pick<Gym, 'capacity' | 'hourlyCapacity' | 'noShowDeductsSession' | 'name'>>
): Promise<{ success: boolean; message: string }> {
  return localizeResult(gymStore.updateGymSettings(patch));
}
