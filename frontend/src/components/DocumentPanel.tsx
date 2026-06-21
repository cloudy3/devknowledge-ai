import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { Document } from '../types';

type Props = {
  documents: Document[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
  onRetry: () => void;
};

export function DocumentPanel({ documents, loading, uploading, error, onUpload, onRetry }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onUpload(file).finally(() => { event.target.value = ''; });
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !uploading) void onUpload(file);
  };

  return <aside className="documents-panel" aria-label="Knowledge base documents">
    <div className="panel-heading">
      <div><span className="eyebrow">Knowledge base</span><h2>Documents</h2></div>
      <span className="count-badge">{documents.length}</span>
    </div>
    <button
      type="button"
      className={`drop-zone ${dragging ? 'dragging' : ''}`}
      onClick={() => input.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      disabled={uploading}
    >
      <span className="upload-icon" aria-hidden="true">↑</span>
      <strong>{uploading ? 'Processing document…' : 'Upload a document'}</strong>
      <small>{uploading ? 'Extracting, chunking, and embedding' : 'Drop a file or click to browse'}</small>
      <span className="file-types">TXT · MD · PDF &nbsp; MAX 10 MB</span>
    </button>
    <input ref={input} className="sr-only" type="file" accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf" onChange={choose} />
    {error && <div className="inline-error" role="alert"><span>{error}</span><button onClick={onRetry}>Retry</button></div>}
    <div className="document-list" aria-live="polite">
      {loading && <div className="list-placeholder">Loading documents…</div>}
      {!loading && !documents.length && <div className="empty-documents"><span>□</span><p>No documents yet</p><small>Your uploaded sources will appear here.</small></div>}
      {documents.map((document) => <article className="document-card" key={document.id}>
        <span className="document-icon" aria-hidden="true">{document.filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'TXT'}</span>
        <div className="document-copy">
          <strong title={document.originalName}>{document.originalName}</strong>
          <small>{document.chunkCount} chunks · {new Date(document.uploadedAt).toLocaleDateString()}</small>
        </div>
        <span className="ready-dot" title="Ready" />
      </article>)}
    </div>
  </aside>;
}

