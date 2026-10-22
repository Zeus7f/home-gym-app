/**
 * src/server/http.ts
 * کمکی‌های مشترک مسیرها: اجرای عملیات دامنه، خواندن امن بدنه، نگاشت خطا.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Database } from '../db/index.ts';
import type { GymStore, UserAccount } from '../lib/store/gymStore';
import type { OpResult } from '../lib/domain/operations';
import { HttpError, snapshotFor, withGym } from './engine.ts';

export type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/** خطاهای async را به error handler می‌رساند */
export const route = (fn: Handler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function statusFor(result: OpResult): number {
  if (result.success) return 200;
  if (result.messageKey === 'auth.forbidden') return 403;
  if (result.messageKey.endsWith('notFound')) return 404;
  return 422;
}

/**
 * مسیر تغییر داده: عملیات در تراکنش روی دادهٔ باشگاه اجرا می‌شود و پاسخ،
 * نتیجه + دادهٔ تازهٔ باشگاه (فیلترشده برای نقش کاربر) است.
 */
export function gymOp<T>(db: Database, fn: (store: GymStore, actor: UserAccount, req: Request) => OpResult<T>): RequestHandler {
  return route(async (req, res) => {
    const auth = req.auth!;
    const { result, store, loaded } = await withGym(db, auth.gymId!, auth.actor, store => fn(store, auth.actor, req));
    res.status(statusFor(result)).json({ ...result, snapshot: snapshotFor(store, loaded, auth.actor) });
  });
}

// ── خواندن بدنه ─────────────────────────────────────────────────────────────

export const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.slice(0, max) : '');
export const num = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN);
export const bool = (v: unknown): boolean => v === true;
export const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
export const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});

// ── خطاها ───────────────────────────────────────────────────────────────────

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, messageKey: err.messageKey, params: err.params });
  }
  // نقض یکتایی نام کاربری (موبایل تکراری در باشگاه دیگر)
  const pgCode = err?.code ?? err?.cause?.code;
  const constraint = err?.constraint ?? err?.cause?.constraint;
  if (pgCode === '23505' && String(constraint).includes('username')) {
    return res.status(409).json({ success: false, messageKey: 'account.phoneTaken' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, messageKey: 'common.invalidInput' });
  }
  console.error('[api] unexpected error:', err);
  res.status(500).json({ success: false, messageKey: 'server.unavailable' });
}
