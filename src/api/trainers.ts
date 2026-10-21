/**
 * src/api/trainers.ts
 * Trainer-related API calls — components import ONLY from here.
 */

import { gymStore } from './_client';
import type { Trainer } from '../lib/domain/gymManagement';
import { createLoginAccount } from './auth';

/** Get all trainers. */
export async function getTrainers(): Promise<Trainer[]> {
  return gymStore.trainers;
}

/** Get a single trainer by ID. */
export async function getTrainer(id: string): Promise<Trainer | undefined> {
  return gymStore.trainers.find(t => t.id === id);
}

/**
 * Add a new trainer. With a password, a sign-in account is created too
 * (B-01: on Supabase Auth when configured; `account` reports that step).
 */
export async function addTrainer(
  data: Parameters<typeof gymStore.addTrainer>[0],
  initialPassword?: string,
): Promise<{ trainer: Trainer; account?: { success: boolean; message: string } }> {
  const trainer = gymStore.addTrainer(data, initialPassword);
  if (!initialPassword?.trim()) return { trainer };
  const account = await createLoginAccount({
    role: 'trainer',
    entityId: trainer.id,
    username: data.phone.replace(/\s+/g, ''),
    password: initialPassword.trim(),
    fullName: trainer.name,
    phone: data.phone,
  });
  return { trainer, account };
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
