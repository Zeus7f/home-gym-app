/**
 * src/api/members.ts
 * Member-related API calls — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import type { Member, DailySession } from '../lib/domain/gymManagement';
import { toman } from '../lib/format';

type ActionResult = { success: boolean; message: string };

/** Get all members. */
export async function getMembers(): Promise<Member[]> {
  return gymStore.members;
}

/** رکورد ورزشکارِ هویت فعال (برای صفحات ورزشکار) */
export function getCurrentMember(): Member | undefined {
  const user = gymStore.actingUser;
  return user?.role === 'member' ? gymStore.members.find(m => m.id === user.entityId) : undefined;
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

/**
 * Record a payment from a member (updates outstanding balance).
 * اعتبارسنجی پیش از mutation انجام می‌شود و نتیجه به زبان فعال برمی‌گردد.
 */
export async function recordMemberPayment(
  memberId: string,
  amount: number,
  method: 'card' | 'cash' | 'transfer',
  description: string,
): Promise<ActionResult> {
  const member = gymStore.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: translateStoreMessage('member.notFound') };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: translateStoreMessage('payment.invalidAmount') };
  }
  gymStore.recordMemberPayment(memberId, amount, method, description);
  return {
    success: true,
    message: translateStoreMessage('member.paymentRecorded', { debt: toman(member.outstandingBalance) }),
  };
}

/** Adjust the session count of a member (+ or −). */
export async function adjustMemberSessions(
  memberId: string,
  delta: number,
  reason: string,
): Promise<ActionResult> {
  const member = gymStore.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: translateStoreMessage('member.notFound') };
  if (!Number.isInteger(delta) || delta === 0) {
    return { success: false, message: translateStoreMessage('member.invalidDelta') };
  }
  if (member.totalSessions + delta < member.usedSessions) {
    return { success: false, message: translateStoreMessage('session.adjustTooLow') };
  }
  gymStore.adjustMemberSessions(memberId, delta, reason);
  return {
    success: true,
    message: translateStoreMessage('member.sessionsAdjusted', { remaining: member.remainingSessions }),
  };
}

/** تغییر مربی دائم ورزشکار. */
export async function changeMemberTrainer(memberId: string, trainerId: string): Promise<ActionResult> {
  return localizeResult(gymStore.changeMemberDefaultTrainer(memberId, trainerId));
}

/** Get all member payment records. */
export async function getPaymentRecords() {
  return gymStore.memberPayments;
}
