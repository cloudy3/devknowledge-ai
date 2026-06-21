import pg from 'pg';
import type { Config } from './config.js';

const { Pool } = pg;

export function createPool(config: Config): pg.Pool {
  return new Pool({
    connectionString: config.databaseUrl,
    ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000
  });
}

