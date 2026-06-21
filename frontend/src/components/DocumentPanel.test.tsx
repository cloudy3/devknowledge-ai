import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocumentPanel } from './DocumentPanel';

describe('DocumentPanel', () => {
  it('sends a selected supported file to the upload handler', async () => {
    const upload = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { container } = render(<DocumentPanel documents={[]} loading={false} uploading={false} error={null} onUpload={upload} onRetry={vi.fn()} />);
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['knowledge'], 'guide.md', { type: 'text/markdown' });
    await user.upload(input, file);
    expect(upload).toHaveBeenCalledWith(file);
    expect(screen.getByText('No documents yet')).toBeInTheDocument();
  });
});

