/**
 * src/api/members.ts
 * Member-related API calls — components import ONLY from here.
 */

import { gymStore, runOp } from './_client';
import { localizeOp } from './_messages';
import * as ops from '../lib/domain/operations';
import type { Member, DailySession } from '../lib/domain/gymManagement';

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

/** Record a payment from a member (updates outstanding balance). */
export async function recordMemberPayment(
  memberId: string,
  amount: number,
  method: 'card' | 'cash' | 'transfer',
  description: string,
): Promise<ActionResult> {
  const body = { amount, method, description };
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/members/${encodeURIComponent(memberId)}/payments`, body }, (s, a) =>
      ops.recordMemberPayment(s, a, { memberId, ...body })
    )
  );
}

/** Adjust the session count of a member (+ or −). */
export async function adjustMemberSessions(
  memberId: string,
  delta: number,
  reason: string,
): Promise<ActionResult> {
  return localizeOp(
    await runOp({ method: 'POST', path: `/api/members/${encodeURIComponent(memberId)}/adjustments`, body: { delta, reason } }, (s, a) =>
      ops.adjustMemberSessions(s, a, { memberId, delta, reason })
    )
  );
}

/** تغییر مربی دائم ورزشکار. */
export async function changeMemberTrainer(memberId: string, trainerId: string): Promise<ActionResult> {
  return localizeOp(
    await runOp({ method: 'PATCH', path: `/api/members/${encodeURIComponent(memberId)}/trainer`, body: { trainerId } }, (s, a) =>
      ops.changeMemberTrainer(s, a, { memberId, trainerId })
    )
  );
}

/** Get all member payment records. */
export async function getPaymentRecords() {
  return gymStore.memberPayments;
}
