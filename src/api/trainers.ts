/**
 * src/api/trainers.ts
 * Trainer-related API calls — components import ONLY from here.
 */

import { gymStore, runOp } from './_client';
import { localizeOp } from './_messages';
import * as ops from '../lib/domain/operations';
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
): Promise<{ success: boolean; message: string }> {
  const body = { amount, method, description };
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/trainers/${encodeURIComponent(trainerId)}/payouts`, body }, (s, a) =>
      ops.recordTrainerPayout(s, a, { trainerId, ...body })
    )
  );
}

/** Get all trainer payout records. */
export async function getTrainerPayoutRecords() {
  return gymStore.trainerPayouts;
}
