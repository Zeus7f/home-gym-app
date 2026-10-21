/**
 * src/api/members.ts
 * Member-related API calls — components import ONLY from here.
 */

import { gymStore } from './_client';
import type { Member, DailySession } from '../lib/domain/gymManagement';

/** Get all members. */
export async function getMembers(): Promise<Member[]> {
  return gymStore.members;
}

/** Get a single member by ID. */
export async function getMember(id: string): Promise<Member | undefined> {
  return gymStore.members.find(m => m.id === id);
}

/** Get members assigned to a specific trainer. */
export async function getMembersByTrainer(trainerId: string): Promise<Member[]> {
  return gymStore.members.filter(m => m.defaultTrainerId === trainerId);
}

/**
 * همه جلسات یک عضو — جلسات امروز و گذشته با هم.
 * منبع واحد برای صفحات سوابق، جلسات و داشبورد ورزشکار.
 */
export async function getMemberSessions(memberId: string): Promise<DailySession[]> {
  return [
    ...gymStore.todaySessions.filter(s => s.memberId === memberId),
    ...gymStore.pastSessions.filter(s => s.memberId === memberId),
  ];
}

/** Add a new member. */
export async function addMember(
  data: Parameters<typeof gymStore.addMember>[0],
): Promise<Member> {
  return gymStore.addMember(data);
}

/** Record a payment from a member (updates outstanding balance). */
export async function recordMemberPayment(
  memberId: string,
  amount: number,
  method: 'card' | 'cash' | 'transfer',
  description: string,
): Promise<void> {
  gymStore.recordMemberPayment(memberId, amount, method, description);
}

/** Adjust the session count of a member (+ or −). */
export async function adjustMemberSessions(
  memberId: string,
  delta: number,
  reason: string,
): Promise<void> {
  gymStore.adjustMemberSessions(memberId, delta, reason);
}

/** Get all member payment records. */
export async function getPaymentRecords() {
  return gymStore.memberPayments;
}
