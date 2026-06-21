import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import type { Config } from './config.js';
import { AppError, errorHandler } from './errors.js';
import type { ChatService } from './services/chatService.js';
import type { DocumentService } from './services/documentService.js';
import type { Repository } from './services/repository.js';

type Dependencies = { config: Config; repository: Repository; documents: DocumentService; chat: ChatService };
const chatSchema = z.object({ sessionId: z.string().uuid(), question: z.string().trim().min(1).max(4000) });
const historySchema = z.object({ sessionId: z.string().uuid() });

export function createApp({ config, repository, documents, chat }: Dependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ redact: ['req.headers.authorization'] }));
  app.use(cors({ origin: config.frontendOrigins, methods: ['GET', 'POST'] }));
  app.use(express.json({ limit: '100kb' }));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSizeBytes, files: 1 } });

  app.get('/health', async (_request, response) => response.json({ status: 'ok' }));
  app.get('/documents', async (_request, response, next) => {
    try { response.json({ documents: await repository.listDocuments() }); } catch (error) { next(error); }
  });
  app.post('/documents/upload', upload.single('file'), async (request, response, next) => {
    try {
      if (!request.file) throw new AppError(400, 'FILE_REQUIRED', 'A file is required in the multipart field "file".');
      response.status(201).json({ document: await documents.ingest(request.file) });
    } catch (error) { next(error); }
  });
  app.post('/chat', async (request, response, next) => {
    try {
      const input = chatSchema.parse(request.body);
      response.status(201).json(await chat.chat(input.sessionId, input.question));
    } catch (error) { next(error); }
  });
  app.get('/chat/history', async (request, response, next) => {
    try {
      const input = historySchema.parse(request.query);
      response.json({ messages: await repository.getHistory(input.sessionId) });
    } catch (error) { next(error); }
  });
  app.use((_request, _response, next) => next(new AppError(404, 'NOT_FOUND', 'Endpoint not found.')));
  app.use(errorHandler);
  return app;
}
