import OpenAI from 'openai';
import type { Config } from '../config.js';
import { AppError } from '../errors.js';

export const EMBEDDING_DIMENSION = 1024;
export const SYSTEM_INSTRUCTION = 'You are a document knowledge assistant. Answer only using the provided document context. If the context does not contain the answer, say that the uploaded documents do not contain enough information. Do not invent facts. Give a concise answer and refer to sources using their bracketed labels.';

export class InferenceService {
  private client: OpenAI;
  constructor(private config: Config['inference']) {
    this.client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl, timeout: 30_000, maxRetries: 2 });
  }

  async embed(inputs: string[]): Promise<number[][]> {
    const output: number[][] = [];
    for (let index = 0; index < inputs.length; index += 64) {
      try {
        const response = await this.client.embeddings.create({
          model: this.config.embeddingModel,
          input: inputs.slice(index, index + 64),
          encoding_format: 'float'
        });
        const ordered = [...response.data].sort((a, b) => a.index - b.index);
        for (const item of ordered) {
          if (item.embedding.length !== EMBEDDING_DIMENSION) {
            throw new AppError(502, 'EMBEDDING_DIMENSION_MISMATCH', `Embedding model returned ${item.embedding.length} dimensions; expected ${EMBEDDING_DIMENSION}.`);
          }
          output.push(item.embedding);
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(502, 'INFERENCE_ERROR', 'The embedding service could not complete the request.');
      }
    }
    return output;
  }

  async answer(question: string, context: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.answerModel,
        temperature: 0.1,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: `DOCUMENT CONTEXT\n${context}\n\nQUESTION\n${question}` }
        ]
      });
      const content = response.choices[0]?.message.content?.trim();
      if (!content) throw new Error('Empty model response');
      return content;
    } catch {
      throw new AppError(502, 'INFERENCE_ERROR', 'The answer service could not complete the request.');
    }
  }
}

