import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import type { Config } from './config.js';
import type { ChatService } from './services/chatService.js';
import type { DocumentService } from './services/documentService.js';
import type { Repository } from './services/repository.js';

const config: Config = {
  databaseUrl: 'postgresql://localhost/test',
  spaces: { endpoint: 'https://example.com', region: 'test', bucket: 'test', accessKeyId: 'key', secretAccessKey: 'secret' },
  inference: { apiKey: 'token', baseUrl: 'https://example.com/v1', embeddingModel: 'embedding', answerModel: 'answer' },
  frontendOrigins: ['http://localhost:5173'], maxFileSizeBytes: 1024, chunkSize: 1000, chunkOverlap: 150,
  retrievalLimit: 5, nodeEnv: 'test', port: 8080
};

function makeApp() {
  const repository = {
    listDocuments: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([])
  } as unknown as Repository;
  const documents = { ingest: vi.fn() } as unknown as DocumentService;
  const chat = { chat: vi.fn() } as unknown as ChatService;
  return { app: createApp({ config, repository, documents, chat }), repository, documents, chat };
}

describe('API', () => {
  it('reports health', async () => {
    const response = await request(makeApp().app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('uses the public error envelope for invalid chat input', async () => {
    const response = await request(makeApp().app).post('/chat').send({ sessionId: 'bad', question: '' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires the named multipart file field', async () => {
    const response = await request(makeApp().app).post('/documents/upload');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('FILE_REQUIRED');
  });

  it('passes the requested session to history storage', async () => {
    const { app, repository } = makeApp();
    const sessionId = '8dadfb14-e65e-43e4-8840-bd0bfa06a7f8';
    const response = await request(app).get(`/chat/history?sessionId=${sessionId}`);
    expect(response.status).toBe(200);
    expect(repository.getHistory).toHaveBeenCalledWith(sessionId);
  });
});

