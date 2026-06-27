import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createPool } from './db.js';

const config = loadConfig();
const pool = createPool(config);
try {
  const sql = await readFile(fileURLToPath(new URL('../migrations/init.sql', import.meta.url)), 'utf8');
  await pool.query(sql);
  console.log('Migration completed.');
} finally {
  await pool.end();
}

