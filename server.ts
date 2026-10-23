/**
 * server.ts — سرور مستقل Home Gym: Express + PostgreSQL، بدون سرویس خارجی.
 *
 *   توسعه:  docker compose up -d db && bun run dev        (Vite به‌صورت middleware)
 *   تولید:  bun run build && bun run start                 (فایل‌های dist/ با کش)
 */

import 'dotenv/config';
// تاریخ‌های جلالی و «امروز» بر اساس ساعت ایران محاسبه می‌شوند
process.env.TZ ??= 'Asia/Tehran';

import path from 'node:path';
import express from 'express';
import { getDb, runMigrations, closeDb } from './src/db/index.ts';
import { createApp } from './src/server/app.ts';
import { jwtSecret } from './src/server/auth/session.ts';

/** تنظیمات ناامن در تولید: هشدار واضح در لاگ (یا توقف برای موارد حیاتی) */
function checkProductionEnv() {
  if (!process.env.DATABASE_URL && !process.env.SQL_HOST) {
    throw new Error('DATABASE_URL (or SQL_HOST/…) must be set in production');
  }
  if (process.env.COOKIE_SECURE === 'false') {
    console.warn('[config] COOKIE_SECURE=false — session cookies are sent over plain HTTP. Use only behind HTTPS-less local tests.');
  }
  if (!process.env.TRUST_PROXY) {
    console.warn('[config] TRUST_PROXY is not set — behind nginx the login rate limit will see the proxy IP instead of the user.');
  }
  if (/homegym_dev_password/.test(process.env.DATABASE_URL ?? '')) {
    console.warn('[config] the database still uses the development password — set POSTGRES_PASSWORD in .env');
  }
}

async function start() {
  const production = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT ?? 3000);

  jwtSecret(); // بدون کلید امن بالا نمی‌آید
  if (production) checkProductionEnv();
  await runMigrations(path.join(process.cwd(), 'drizzle'));

  const app = createApp(getDb(), { production });

  if (!production) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    // فایل‌های دارای hash یک سال کش؛ index.html همیشه تازه
    app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Home Gym server running on http://localhost:${port} (${production ? 'production' : 'development'})`);
  });

  const shutdown = () => {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
