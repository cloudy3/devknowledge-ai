import type pg from 'pg';
import type { ChatMessage, Citation, DocumentRecord } from '../types.js';

type RetrievedChunk = Citation & { content: string };

export class Repository {
  constructor(private pool: pg.Pool) {}

  async listDocuments(): Promise<DocumentRecord[]> {
    const result = await this.pool.query(`
      SELECT d.id, d.filename, d.original_name AS "originalName", d.mime_type AS "mimeType",
             d.uploaded_at AS "uploadedAt", COUNT(c.id)::int AS "chunkCount"
      FROM documents d LEFT JOIN document_chunks c ON c.document_id = d.id
      GROUP BY d.id ORDER BY d.uploaded_at DESC
    `);
    return result.rows;
  }

  async saveDocument(file: Express.Multer.File, spacesKey: string, chunks: string[], embeddings: number[][]): Promise<DocumentRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const documentResult = await client.query(`
        INSERT INTO documents (filename, original_name, mime_type, spaces_key)
        VALUES ($1, $2, $3, $4)
        RETURNING id, filename, original_name AS "originalName", mime_type AS "mimeType", uploaded_at AS "uploadedAt"
      `, [file.originalname, file.originalname, file.mimetype, spacesKey]);
      const document = documentResult.rows[0];
      for (let index = 0; index < chunks.length; index += 1) {
        await client.query(
          'INSERT INTO document_chunks (document_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4::vector)',
          [document.id, index, chunks[index], `[${embeddings[index].join(',')}]`]
        );
      }
      await client.query('COMMIT');
      return { ...document, chunkCount: chunks.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async retrieve(embedding: number[], limit: number): Promise<RetrievedChunk[]> {
    const vector = `[${embedding.join(',')}]`;
    const result = await this.pool.query(`
      SELECT d.id AS "documentId", c.id AS "chunkId", d.filename, c.chunk_index AS "chunkIndex",
             c.content, LEFT(c.content, 240) AS preview,
             GREATEST(0, 1 - (c.embedding <=> $1::vector))::float AS similarity
      FROM document_chunks c JOIN documents d ON d.id = c.document_id
      ORDER BY c.embedding <=> $1::vector LIMIT $2
    `, [vector, limit]);
    return result.rows;
  }

  async saveConversation(sessionId: string, question: string, answer: string, citations: Citation[]): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(`INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)
        RETURNING id, role, content, created_at AS "createdAt"`, [sessionId, question]);
      const assistantResult = await client.query(`INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'assistant', $2)
        RETURNING id, role, content, created_at AS "createdAt"`, [sessionId, answer]);
      for (const citation of citations) {
        await client.query(`INSERT INTO chat_citations
          (chat_message_id, document_id, chunk_id, filename, chunk_index, chunk_preview, similarity)
          VALUES ($1,$2,$3,$4,$5,$6,$7)`, [assistantResult.rows[0].id, citation.documentId, citation.chunkId, citation.filename, citation.chunkIndex, citation.preview, citation.similarity]);
      }
      await client.query('COMMIT');
      return {
        userMessage: { ...userResult.rows[0], citations: [] },
        assistantMessage: { ...assistantResult.rows[0], citations }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.pool.query(`SELECT id, role, content, created_at AS "createdAt"
      FROM chat_messages WHERE session_id = $1 ORDER BY created_at, id`, [sessionId]);
    if (!messages.rowCount) return [];
    const citations = await this.pool.query(`SELECT cc.chat_message_id AS "messageId", cc.document_id AS "documentId",
      cc.chunk_id AS "chunkId", cc.filename, cc.chunk_index AS "chunkIndex", cc.chunk_preview AS preview,
      cc.similarity::float AS similarity FROM chat_citations cc JOIN chat_messages cm ON cm.id = cc.chat_message_id
      WHERE cm.session_id = $1 ORDER BY cc.created_at, cc.id`, [sessionId]);
    const byMessage = new Map<string, Citation[]>();
    for (const { messageId, ...citation } of citations.rows) {
      byMessage.set(messageId, [...(byMessage.get(messageId) ?? []), citation]);
    }
    return messages.rows.map((message) => ({ ...message, citations: byMessage.get(message.id) ?? [] }));
  }
}

