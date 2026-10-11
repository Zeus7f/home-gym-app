/**
 * src/api/gym.ts
 * Gym-level data (name, capacity, audit log).
 */

import { gymStore } from './_client';
import type { Gym } from '../lib/domain/gymManagement';

/** Get current gym settings. */
export async function getGym(): Promise<Gym> {
  return gymStore.gym;
}
