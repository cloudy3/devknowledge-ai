import { describe, expect, it } from 'vitest';
import { chunkText, normalizeText } from './chunkingService.js';

describe('chunking', () => {
  it('normalizes whitespace', () => expect(normalizeText('one  two\r\n\r\n\r\nthree')).toBe('one two\n\nthree'));
  it('creates bounded overlapping chunks without losing the tail', () => {
    const input = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');
    const chunks = chunkText(input, 100, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
    expect(chunks.at(-1)).toContain('word79');
  });
  it('rejects an invalid overlap', () => expect(() => chunkText('text', 100, 100)).toThrow());
});

