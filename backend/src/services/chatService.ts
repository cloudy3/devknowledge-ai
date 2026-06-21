import type { Config } from '../config.js';
import type { Citation } from '../types.js';
import type { InferenceService } from './inferenceService.js';
import type { Repository } from './repository.js';

const NOT_ENOUGH_INFORMATION = 'The uploaded documents do not contain enough information to answer this question.';

export class ChatService {
  constructor(private config: Config, private repository: Repository, private inference: InferenceService) {}

  async chat(sessionId: string, question: string) {
    const [questionEmbedding] = await this.inference.embed([question]);
    const chunks = await this.repository.retrieve(questionEmbedding, this.config.retrievalLimit);
    const citations: Citation[] = chunks.map(({ content: _content, ...citation }) => citation);
    const context = chunks.map((chunk, index) => `[Source ${index + 1}: ${chunk.filename}, chunk ${chunk.chunkIndex + 1}]\n${chunk.content}`).join('\n\n');
    const answer = chunks.length ? await this.inference.answer(question, context) : NOT_ENOUGH_INFORMATION;
    const messages = await this.repository.saveConversation(sessionId, question, answer, citations);
    return { ...messages, citations };
  }
}

