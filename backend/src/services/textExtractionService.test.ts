import { describe, expect, it } from 'vitest';
import { AppError } from '../errors.js';
import { extractText, validateFile } from './textExtractionService.js';

function file(name: string, type: string, content: string): Express.Multer.File {
  return { fieldname: 'file', originalname: name, encoding: '7bit', mimetype: type, size: content.length,
    destination: '', filename: '', path: '', buffer: Buffer.from(content), stream: undefined as never };
}

describe('text extraction', () => {
  it('extracts and normalizes text documents', async () => {
    await expect(extractText(file('notes.md', 'text/markdown', 'hello   world'))).resolves.toBe('hello world');
  });
  it('rejects mismatched unsupported input', () => {
    expect(() => validateFile(file('malware.exe', 'application/octet-stream', 'x'))).toThrow(AppError);
  });
  it('rejects empty extracted text', async () => {
    await expect(extractText(file('empty.txt', 'text/plain', '   '))).rejects.toMatchObject({ code: 'NO_EXTRACTABLE_TEXT' });
  });
});

