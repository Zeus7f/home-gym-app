import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import { poolConfig } from './index.ts';

const cfg = poolConfig();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: cfg.connectionString
    ? { url: cfg.connectionString }
    : {
        host: cfg.host ?? 'localhost',
        port: cfg.port ?? 5432,
        user: cfg.user,
        password: cfg.password as string | undefined,
        database: cfg.database ?? 'homegym',
        ssl: false,
      },
  verbose: true,
});
