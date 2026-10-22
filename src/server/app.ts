/**
 * src/server/app.ts
 * برنامهٔ Express: امنیت پایه، مسیرهای /api با محافظ نقش، و خطای استاندارد.
 * سرویس‌دهی فایل‌های فرانت‌اند در server.ts انجام می‌شود.
 */

import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import type { Database } from '../db/index.ts';
import { requireAuth, requireGym, requireRole } from './auth/session.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { adminRoutes } from './routes/admin.routes.ts';
import { gymRoutes } from './routes/gym.routes.ts';
import { accountRoutes, memberRoutes, trainerRoutes } from './routes/people.routes.ts';
import { exerciseRoutes, programRoutes, sessionRoutes } from './routes/training.routes.ts';
import { errorHandler } from './http.ts';

/** هدرهای امنیتی؛ CSP فقط در تولید (Vite در توسعه اسکریپت درون‌خطی دارد) */
function securityHeaders(production: boolean): express.RequestHandler {
  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (production) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          // تصاویر و ویدیوهای حرکات از منابع خارجی HTTPS بارگذاری می‌شوند
          "img-src 'self' data: blob: https:",
          "media-src 'self' https:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
      );
    }
    next();
  };
}

export function createApp(db: Database, opts: { production: boolean }): Express {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.use(securityHeaders(opts.production));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  // پاسخ‌های API هرگز در کش ذخیره نمی‌شوند
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  const auth = requireAuth(db);
  const gym = requireGym(db);

  app.use('/api/auth', authRoutes(db));
  app.use('/api/admin', auth, requireRole('super_admin'), adminRoutes(db));

  // مسیرهای باشگاه: کاربر واردشده + باشگاه مشخص؛ مالکیت و نقش در operations.ts
  app.use('/api/gym', auth, gym, gymRoutes(db));
  app.use('/api/accounts', auth, gym, requireRole('owner', 'super_admin'), accountRoutes(db));
  app.use('/api/members', auth, gym, requireRole('owner', 'trainer', 'super_admin'), memberRoutes(db));
  app.use('/api/trainers', auth, gym, requireRole('owner', 'super_admin'), trainerRoutes(db));
  app.use('/api/sessions', auth, gym, sessionRoutes(db));
  app.use('/api/programs', auth, gym, requireRole('owner', 'trainer', 'super_admin'), programRoutes(db));
  app.use('/api/exercises', auth, gym, requireRole('owner', 'trainer', 'super_admin'), exerciseRoutes(db));

  app.use('/api', (_req, res) => res.status(404).json({ success: false, messageKey: 'common.notFound' }));
  app.use(errorHandler);
  return app;
}
