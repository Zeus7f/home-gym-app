/**
 * /api/accounts، /api/members، /api/trainers — حساب‌ها، ورزشکاران، مربیان و امور مالی آن‌ها.
 */

import { Router } from 'express';
import type { Database } from '../../db/index.ts';
import * as ops from '../../lib/domain/operations';
import { arr, bool, gymOp, num, obj, str } from '../http.ts';

type Method = 'card' | 'cash' | 'transfer';
const method = (v: unknown): Method => (v === 'cash' || v === 'transfer' ? v : 'card');

/** /api/accounts — رمز و وضعیت حساب مربی/ورزشکار (مدیر) */
export function accountRoutes(db: Database) {
  const r = Router();
  r.patch(
    '/:id/password',
    gymOp(db, (store, actor, req) => ops.resetAccountPassword(store, actor, { userId: req.params.id, password: str(req.body?.password, 200) }))
  );
  r.patch(
    '/:id/status',
    gymOp(db, (store, actor, req) => ops.setAccountActive(store, actor, { userId: req.params.id, active: bool(req.body?.active) }))
  );
  return r;
}

/** /api/members */
export function memberRoutes(db: Database) {
  const r = Router();

  /** مدیر: ورزشکار کامل با بسته؛ مربی: فقط نام، موبایل و رمز */
  r.post(
    '/',
    gymOp(db, (store, actor, req) => {
      const b = obj(req.body);
      if (actor.role === 'trainer') {
        return ops.createMemberAsTrainer(store, actor, { name: str(b.name, 255), phone: str(b.phone, 30), password: str(b.password, 200) });
      }
      const d = obj(b.data);
      return ops.createMember(store, actor, {
        password: str(b.password, 200),
        data: {
          name: str(d.name, 255),
          phone: str(d.phone, 30),
          defaultTrainerId: str(d.defaultTrainerId, 80),
          defaultTrainerName: '',
          packageName: str(d.packageName, 255),
          totalSessions: Math.round(num(d.totalSessions)),
          packagePrice: Math.max(0, num(d.packagePrice) || 0),
          paidAmount: Math.max(0, num(d.paidAmount) || 0),
          startDate: str(d.startDate, 10),
          expirationDate: str(d.expirationDate, 10),
          status: 'active',
        },
      });
    })
  );

  r.post(
    '/:id/payments',
    gymOp(db, (store, actor, req) =>
      ops.recordMemberPayment(store, actor, {
        memberId: req.params.id,
        amount: num(req.body?.amount),
        method: method(req.body?.method),
        description: str(req.body?.description, 500),
      })
    )
  );

  r.post(
    '/:id/adjustments',
    gymOp(db, (store, actor, req) =>
      ops.adjustMemberSessions(store, actor, { memberId: req.params.id, delta: num(req.body?.delta), reason: str(req.body?.reason, 500) })
    )
  );

  r.patch(
    '/:id/trainer',
    gymOp(db, (store, actor, req) => ops.changeMemberTrainer(store, actor, { memberId: req.params.id, trainerId: str(req.body?.trainerId, 80) }))
  );

  r.put(
    '/:id/package',
    gymOp(db, (store, actor, req) => {
      const b = obj(req.body);
      return ops.assignMemberPackage(store, actor, {
        memberId: req.params.id,
        packageName: str(b.packageName, 255),
        totalSessions: Math.round(num(b.totalSessions)),
        packagePrice: Math.max(0, num(b.packagePrice) || 0),
        paidAmount: Math.max(0, num(b.paidAmount) || 0),
        startDate: str(b.startDate, 10),
        expirationDate: str(b.expirationDate, 10),
      });
    })
  );

  return r;
}

/** /api/trainers */
export function trainerRoutes(db: Database) {
  const r = Router();

  r.post(
    '/',
    gymOp(db, (store, actor, req) => {
      const b = obj(req.body);
      const d = obj(b.data);
      return ops.createTrainer(store, actor, {
        password: str(b.password, 200),
        data: {
          name: str(d.name, 255),
          phone: str(d.phone, 30),
          specialty: str(d.specialty, 255),
          status: 'active',
          workingDays: arr<string>(d.workingDays).map(x => str(x, 20)).slice(0, 7),
          workingHours: str(d.workingHours, 60),
          dailyCapacity: Math.max(1, Math.round(num(d.dailyCapacity)) || 6),
          sessionRate: Math.max(0, num(d.sessionRate) || 0),
        },
      });
    })
  );

  r.post(
    '/:id/payouts',
    gymOp(db, (store, actor, req) =>
      ops.recordTrainerPayout(store, actor, {
        trainerId: req.params.id,
        amount: num(req.body?.amount),
        method: method(req.body?.method),
        description: str(req.body?.description, 500),
      })
    )
  );

  return r;
}
