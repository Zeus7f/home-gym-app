/**
 * src/api/trainers.ts
 * Trainer-related API calls — components import ONLY from here.
 */

import { gymStore } from './_client';
import type { Trainer } from '../lib/domain/gymManagement';

/** Get all trainers. */
export async function getTrainers(): Promise<Trainer[]> {
  return gymStore.trainers;
}

/** Get a single trainer by ID. */
export async function getTrainer(id: string): Promise<Trainer | undefined> {
  return gymStore.trainers.find(t => t.id === id);
}

/** Record a payout to a trainer (updates outstanding compensation). */
export async function recordTrainerPayout(
  trainerId: string,
  amount: number,
  method: 'card' | 'transfer' | 'cash',
  description: string,
): Promise<void> {
  gymStore.recordTrainerPayout(trainerId, amount, method, description);
}

/** Get all trainer payout records. */
export async function getTrainerPayoutRecords() {
  return gymStore.trainerPayouts;
}
