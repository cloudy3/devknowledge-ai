import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';

describe('ChatPanel', () => {
  it('shows grounded citations', () => {
    render(<ChatPanel loading={false} sending={false} error={null} documentCount={1} onSend={vi.fn()} onRetryHistory={vi.fn()} messages={[{
      id: '1', role: 'assistant', content: 'The answer.', createdAt: new Date().toISOString(), citations: [{ documentId: 'd', chunkId: 'c', filename: 'guide.md', chunkIndex: 0, preview: 'Relevant text', similarity: 0.91 }]
    }]} />);
    expect(screen.getByText('The answer.')).toBeInTheDocument();
    expect(screen.getByText('1 source used')).toBeInTheDocument();
  });
});

