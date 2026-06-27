import path from 'node:path';
import pdf from 'pdf-parse';
import { AppError } from '../errors.js';
import { normalizeText } from './chunkingService.js';

const allowedExtensions = new Set(['.txt', '.md', '.pdf']);
const allowedMimeTypes = new Set(['text/plain', 'text/markdown', 'text/x-markdown', 'application/pdf', 'application/octet-stream']);

export function validateFile(file: Express.Multer.File): void {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Only .txt, .md, and .pdf documents are supported.');
  }
  if (!file.buffer.length) throw new AppError(400, 'EMPTY_FILE', 'The uploaded file is empty.');
}

export async function extractText(file: Express.Multer.File): Promise<string> {
  validateFile(file);
  const extension = path.extname(file.originalname).toLowerCase();
  const raw = extension === '.pdf' ? (await pdf(file.buffer)).text : file.buffer.toString('utf8');
  const text = normalizeText(raw);
  if (!text) {
    throw new AppError(422, 'NO_EXTRACTABLE_TEXT', 'The document contains no extractable text. Scanned PDFs require OCR, which is not supported in v1.');
  }
  return text;
}

