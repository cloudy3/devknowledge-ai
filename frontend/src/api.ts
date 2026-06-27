import type { Document, Message, Citation } from './types';

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, init);
  } catch {
    throw new Error('Could not reach the API. Check that the backend is running.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Request failed (${response.status}).`);
  return body as T;
}

export const api = {
  async listDocuments(): Promise<Document[]> {
    return (await request<{ documents: Document[] }>('/documents')).documents;
  },
  async upload(file: File): Promise<Document> {
    const form = new FormData();
    form.append('file', file);
    return (await request<{ document: Document }>('/documents/upload', { method: 'POST', body: form })).document;
  },
  async history(sessionId: string): Promise<Message[]> {
    return (await request<{ messages: Message[] }>(`/chat/history?sessionId=${encodeURIComponent(sessionId)}`)).messages;
  },
  async chat(sessionId: string, question: string): Promise<{ userMessage: Message; assistantMessage: Message; citations: Citation[] }> {
    return request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question })
    });
  }
};

