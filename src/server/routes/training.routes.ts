/**
 * /api/sessions، /api/programs، /api/exercises — نوبت‌ها، ثبت جلسه، برنامه‌ها و حرکات سفارشی.
 * همهٔ قواعد (ظرفیت، تداخل، مهلت ۴ ساعته، اعتبار بسته، مالکیت) در operations.ts اجرا می‌شوند.
 */

import { Router } from 'express';
import type { Database } from '../../db/index.ts';
import type { ExerciseItem, SessionExercise, WorkoutProgram } from '../../lib/store/gymStore';
import * as ops from '../../lib/domain/operations';
import { arr, gymOp, obj, str } from '../http.ts';

const exercisesFrom = (v: unknown) => arr<SessionExercise>(v).slice(0, 60);

export function sessionRoutes(db: Database) {
  const r = Router();

  r.post(
    '/',
    gymOp(db, (store, actor, req) => {
      const b = obj(req.body);
      return ops.scheduleSession(store, actor, {
        date: str(b.date, 10),
        time: str(b.time, 5),
        memberId: str(b.memberId, 80),
        trainerId: str(b.trainerId, 80),
        exercises: exercisesFrom(b.exercises),
      });
    })
  );

  /** افزودن سریع به امروز */
  r.post(
    '/quick',
    gymOp(db, (store, actor, req) =>
      ops.addSessionToToday(store, actor, {
        memberId: str(req.body?.memberId, 80),
        trainerId: str(req.body?.trainerId, 80),
        time: str(req.body?.time, 5) || undefined,
      })
    )
  );

  r.post('/:id/check-in', gymOp(db, (store, actor, req) => ops.checkInSession(store, actor, { sessionId: req.params.id })));

  r.post(
    '/:id/complete',
    gymOp(db, (store, actor, req) =>
      ops.completeSession(store, actor, { sessionId: req.params.id, exercises: req.body?.exercises ? exercisesFrom(req.body.exercises) : undefined })
    )
  );

  r.post(
    '/:id/cancel',
    gymOp(db, (store, actor, req) => ops.cancelSession(store, actor, { sessionId: req.params.id, reason: str(req.body?.reason, 300) || undefined }))
  );

  r.post(
    '/:id/reschedule',
    gymOp(db, (store, actor, req) =>
      ops.rescheduleSession(store, actor, { sessionId: req.params.id, newTime: str(req.body?.time, 5), reason: str(req.body?.reason, 300) || undefined })
    )
  );

  /** لغو توسط خود ورزشکار (مهلت ۴ ساعته) */
  r.post(
    '/:id/member-cancel',
    gymOp(db, (store, actor, req) => ops.cancelSessionByMember(store, actor, { sessionId: req.params.id, reason: str(req.body?.reason, 300) || undefined }))
  );

  r.patch(
    '/:id/trainer',
    gymOp(db, (store, actor, req) => ops.reassignDailyTrainer(store, actor, { sessionId: req.params.id, newTrainerId: str(req.body?.trainerId, 80) }))
  );

  return r;
}

export function programRoutes(db: Database) {
  const r = Router();

  /** ایجاد یا به‌روزرسانی (با id) پیش‌نویس برنامه */
  r.post(
    '/',
    gymOp(db, (store, actor, req) => {
      const b = obj(req.body);
      const days = arr<WorkoutProgram['days'][number]>(b.days)
        .slice(0, 14)
        .map(d => ({
          id: str(d?.id, 80),
          title: str(d?.title, 255),
          items: arr<WorkoutProgram['days'][number]['items'][number]>(d?.items).slice(0, 40),
        }));
      return ops.saveProgram(store, actor, {
        id: str(b.id, 80) || undefined,
        memberId: str(b.memberId, 80),
        memberName: str(b.memberName, 255),
        trainerId: str(b.trainerId, 80),
        trainerName: str(b.trainerName, 255),
        title: str(b.title, 255),
        description: str(b.description, 2000) || undefined,
        days,
      });
    })
  );

  r.post('/:id/publish', gymOp(db, (store, actor, req) => ops.publishProgram(store, actor, { programId: req.params.id })));
  r.post('/:id/unpublish', gymOp(db, (store, actor, req) => ops.unpublishProgram(store, actor, { programId: req.params.id })));
  r.delete('/:id', gymOp(db, (store, actor, req) => ops.deleteProgram(store, actor, { programId: req.params.id })));

  return r;
}

export function exerciseRoutes(db: Database) {
  const r = Router();
  r.post('/', gymOp(db, (store, actor, req) => ops.addCustomExercise(store, actor, { data: obj(req.body) as Omit<ExerciseItem, 'id'> })));
  r.patch('/:id', gymOp(db, (store, actor, req) => ops.updateExercise(store, actor, { id: req.params.id, updates: obj(req.body) })));
  r.delete('/:id', gymOp(db, (store, actor, req) => ops.deleteCustomExercise(store, actor, { id: req.params.id })));
  return r;
}
