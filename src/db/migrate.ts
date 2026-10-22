/** bun run db:migrate — اجرای migrationهای drizzle/ بدون بالا آوردن سرور */
import 'dotenv/config';
import { closeDb, runMigrations } from './index.ts';

runMigrations('drizzle')
  .then(async () => {
    console.log('✓ migrations applied');
    await closeDb();
  })
  .catch(async err => {
    console.error('Migration failed:', err);
    await closeDb();
    process.exit(1);
  });
