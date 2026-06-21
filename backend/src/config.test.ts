import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

const valid = {
  DATABASE_URL: 'postgresql://localhost/test', SPACES_ENDPOINT: 'https://sgp1.digitaloceanspaces.com',
  SPACES_REGION: 'sgp1', SPACES_BUCKET: 'bucket', SPACES_ACCESS_KEY_ID: 'key', SPACES_SECRET_ACCESS_KEY: 'secret',
  DIGITALOCEAN_INFERENCE_API_KEY: 'token'
};

describe('configuration', () => {
  it('loads defaults', () => expect(loadConfig(valid).chunkSize).toBe(1000));
  it('rejects overlap greater than size', () => expect(() => loadConfig({ ...valid, CHUNK_SIZE: '500', CHUNK_OVERLAP: '500' })).toThrow(/CHUNK_OVERLAP/));
});

