/**
 * src/api/members.ts
 * Member-related API calls — components import ONLY from here.
 */

import { gymStore } from './_client';
import { localizeResult, translateStoreMessage } from './_messages';
import type { Member, DailySession } from '../lib/domain/gymManagement';
import { toman } from '../lib/format';
import { createLoginAccount } from './auth';

type ActionResult = { success: boolean; message: string };

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

/**
 * Add a new member. With a password, a sign-in account is created too
 * (B-01: on Supabase Auth when configured; `account` reports that step).
 */
export async function addMember(
  data: Parameters<typeof gymStore.addMember>[0],
  initialPassword?: string,
): Promise<{ member: Member; account?: ActionResult }> {
  const member = gymStore.addMember(data, initialPassword);
  if (!initialPassword?.trim()) return { member };
  const account = await createLoginAccount({
    role: 'member',
    entityId: member.id,
    username: data.phone.replace(/\s+/g, ''),
    password: initialPassword.trim(),
    fullName: member.name,
    phone: data.phone,
  });
  return { member, account };
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
