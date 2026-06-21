export type DocumentRecord = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
  chunkCount: number;
};

export type Citation = {
  documentId: string;
  chunkId: string;
  filename: string;
  chunkIndex: number;
  preview: string;
  similarity: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  citations: Citation[];
};

