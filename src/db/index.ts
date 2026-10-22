import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

export type Database = NodePgDatabase<typeof schema>;

/**
 * تنظیمات اتصال: DATABASE_URL، یا SQL_HOST / SQL_PORT / SQL_USER / SQL_PASSWORD / SQL_DB_NAME.
 * SQL_SSL=true برای سرورهایی که اتصال رمزنگاری‌شده می‌خواهند.
 */
export function poolConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  const common: PoolConfig = {
    max: Number(env.SQL_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl: env.SQL_SSL === 'true' ? { rejectUnauthorized: env.SQL_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  };
  if (env.DATABASE_URL) return { ...common, connectionString: env.DATABASE_URL };
  return {
    ...common,
    host: env.SQL_HOST ?? 'localhost',
    port: Number(env.SQL_PORT ?? 5432),
    user: env.SQL_USER,
    password: env.SQL_PASSWORD,
    database: env.SQL_DB_NAME,
  };
}

let pool: Pool | null = null;
let database: Database | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig());
    pool.on('error', err => console.error('Unexpected error on idle PostgreSQL client:', err));
  }
  return pool;
}

export function getDb(): Database {
  if (!database) database = drizzle(getPool(), { schema });
  return database;
}

/** اجرای migrationهای پوشهٔ drizzle/ (هنگام بالا آمدن سرور) */
export async function runMigrations(migrationsFolder = 'drizzle'): Promise<void> {
  await migrate(getDb(), { migrationsFolder });
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = null;
  database = null;
}

export { schema };
