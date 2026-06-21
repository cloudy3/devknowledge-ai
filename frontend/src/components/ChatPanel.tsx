import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Message } from '../types';

type Props = {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  documentCount: number;
  onSend: (question: string) => Promise<void>;
  onRetryHistory: () => void;
};

export function ChatPanel({ messages, loading, sending, error, documentCount, onSend, onRetryHistory }: Props) {
  const [question, setQuestion] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView?.({ behavior: 'smooth' }), [messages, sending]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = question.trim();
    if (!value || sending) return;
    void onSend(value)
      .then(() => setQuestion((current) => current.trim() === value ? '' : current))
      .catch(() => undefined);
  };

  return <main className="chat-panel">
    <div className="chat-heading">
      <div><span className="eyebrow">Grounded answers</span><h2>Ask your knowledge base</h2></div>
      <div className="status-pill"><span /> {documentCount ? `${documentCount} source${documentCount === 1 ? '' : 's'} ready` : 'Awaiting sources'}</div>
    </div>
    <section className="messages" aria-live="polite" aria-busy={loading || sending}>
      {loading && <div className="welcome"><div className="spark">✦</div><p>Loading this session…</p></div>}
      {!loading && !messages.length && <div className="welcome">
        <div className="spark">✦</div>
        <h3>Your documents, made queryable.</h3>
        <p>Upload engineering notes, specifications, or PDFs, then ask a question. Answers stay grounded in your sources.</p>
      </div>}
      {messages.map((message) => <article className={`message ${message.role}`} key={message.id}>
        <div className="avatar" aria-hidden="true">{message.role === 'assistant' ? '✦' : 'You'}</div>
        <div className="message-body">
          <span className="message-label">{message.role === 'assistant' ? 'DevKnowledge AI' : 'You'}</span>
          <p>{message.content}</p>
          {!!message.citations?.length && <details className="sources">
            <summary>{message.citations.length} source{message.citations.length === 1 ? '' : 's'} used</summary>
            <div className="source-list">{message.citations.map((citation, index) => <div className="source-card" key={citation.chunkId}>
              <div><strong>[{index + 1}] {citation.filename}</strong><span>{Math.round(citation.similarity * 100)}% match · Chunk {citation.chunkIndex + 1}</span></div>
              <p>{citation.preview}{citation.preview.length >= 240 ? '…' : ''}</p>
            </div>)}</div>
          </details>}
        </div>
      </article>)}
      {sending && <div className="message assistant"><div className="avatar">✦</div><div className="thinking"><i /><i /><i /><span>Searching your documents</span></div></div>}
      {error && <div className="chat-error" role="alert"><span>{error}</span>{loading && <button onClick={onRetryHistory}>Retry</button>}</div>}
      <div ref={end} />
    </section>
    <form className="composer" onSubmit={submit}>
      <label htmlFor="question" className="sr-only">Ask a question</label>
      <textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your documents…" rows={1} maxLength={4000}
        onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
      <button type="submit" disabled={!question.trim() || sending} aria-label="Send question">{sending ? '…' : '↑'}</button>
      <small>Answers are generated only from uploaded document context.</small>
    </form>
  </main>;
}
