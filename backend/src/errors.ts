import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public expose = true) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  request.log?.error({ err: error }, 'Request failed');
  if (error instanceof AppError) {
    response.status(error.status).json({ error: { code: error.code, message: error.expose ? error.message : 'The request could not be completed.' } });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message ?? 'Invalid request.' } });
    return;
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'The file exceeds the configured size limit.' : error.message;
    response.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
    return;
  }
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
};

