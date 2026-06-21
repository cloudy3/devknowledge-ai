import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { ChatPanel } from './components/ChatPanel';
import { DocumentPanel } from './components/DocumentPanel';
import { getSessionId } from './session';
import type { Document, Message } from './types';

export default function App() {
  const sessionId = useMemo(getSessionId, []);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true); setDocumentError(null);
    try { setDocuments(await api.listDocuments()); } catch (error) { setDocumentError((error as Error).message); }
    finally { setDocumentsLoading(false); }
  }, []);
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true); setChatError(null);
    try { setMessages(await api.history(sessionId)); } catch (error) { setChatError((error as Error).message); }
    finally { setHistoryLoading(false); }
  }, [sessionId]);
  useEffect(() => { void loadDocuments(); void loadHistory(); }, [loadDocuments, loadHistory]);

  const upload = async (file: File) => {
    setUploading(true); setDocumentError(null);
    try {
      const document = await api.upload(file);
      setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
    } catch (error) { setDocumentError((error as Error).message); }
    finally { setUploading(false); }
  };
  const send = async (question: string) => {
    setSending(true); setChatError(null);
    try {
      const result = await api.chat(sessionId, question);
      setMessages((current) => [...current, result.userMessage, { ...result.assistantMessage, citations: result.citations }]);
    } catch (error) {
      setChatError((error as Error).message);
      throw error;
    }
    finally { setSending(false); }
  };

  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="/" aria-label="DevKnowledge AI home"><span>DK</span><div><strong>DevKnowledge</strong><small>AI</small></div></a>
      <p>Document intelligence for engineering teams</p>
      <span className="github-link">RAG portfolio project</span>
    </header>
    <div className="workspace">
      <DocumentPanel documents={documents} loading={documentsLoading} uploading={uploading} error={documentError} onUpload={upload} onRetry={loadDocuments} />
      <ChatPanel messages={messages} loading={historyLoading} sending={sending} error={chatError} documentCount={documents.length} onSend={send} onRetryHistory={loadHistory} />
    </div>
  </div>;
}
