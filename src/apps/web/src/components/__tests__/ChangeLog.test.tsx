import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ChangeLog } from '../ChangeLog';

const mockChanges = [
  {
    id: '1',
    summary: 'First insertion',
    content: 'Initial content block',
    createdAt: new Date().toISOString(),
    highlight: false,
  },
  {
    id: '2',
    summary: 'Second insertion',
    content: 'Content appended via Add to draft',
    createdAt: new Date().toISOString(),
    highlight: true,
  },
];

describe('ChangeLog', () => {
  it('renders highlighted change in blue', () => {
    const markup = renderToString(<ChangeLog changes={mockChanges as any} workspaceId="workspace" />);
    expect(markup).toContain('Second insertion');
    expect(markup).toContain('text-blue-');
  });
});
