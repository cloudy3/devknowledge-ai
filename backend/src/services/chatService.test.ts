import { describe, expect, it, vi } from 'vitest';
import type { Config } from '../config.js';
import { ChatService } from './chatService.js';
import type { InferenceService } from './inferenceService.js';
import type { Repository } from './repository.js';

const config = { retrievalLimit: 5 } as Config;
const saved = {
  userMessage: { id: 'u', role: 'user', content: 'Question', createdAt: '', citations: [] },
  assistantMessage: { id: 'a', role: 'assistant', content: 'Answer', createdAt: '', citations: [] }
};

describe('ChatService', () => {
  it('returns the explicit fallback without invoking the answer model when no chunks exist', async () => {
    const repository = {
      retrieve: vi.fn().mockResolvedValue([]),
      saveConversation: vi.fn().mockResolvedValue(saved)
    } as unknown as Repository;
    const inference = { embed: vi.fn().mockResolvedValue([[0]]), answer: vi.fn() } as unknown as InferenceService;
    const result = await new ChatService(config, repository, inference).chat('session', 'Question');
    expect(result.assistantMessage.content).toBe('Answer');
    expect(inference.answer).not.toHaveBeenCalled();
    expect(repository.saveConversation).toHaveBeenCalledWith('session', 'Question', expect.stringContaining('not contain enough information'), []);
  });

  it('builds server-derived citations from retrieved chunks', async () => {
    const chunk = { documentId: 'd', chunkId: 'c', filename: 'guide.md', chunkIndex: 2, preview: 'preview', similarity: 0.9, content: 'source content' };
    const repository = {
      retrieve: vi.fn().mockResolvedValue([chunk]),
      saveConversation: vi.fn().mockResolvedValue(saved)
    } as unknown as Repository;
    const inference = {
      embed: vi.fn().mockResolvedValue([[0]]),
      answer: vi.fn().mockResolvedValue('Grounded answer')
    } as unknown as InferenceService;
    const result = await new ChatService(config, repository, inference).chat('session', 'Question');
    expect(inference.answer).toHaveBeenCalledWith('Question', expect.stringContaining('[Source 1: guide.md, chunk 3]'));
    expect(result.citations[0]).not.toHaveProperty('content');
    expect(result.citations[0].chunkId).toBe('c');
  });
});

