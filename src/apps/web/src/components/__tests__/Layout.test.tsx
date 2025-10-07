import { describe, expect, it } from 'vitest';
import { StaticRouter } from 'react-router-dom/server';
import { Layout } from '../Layout';
import { renderToString } from 'react-dom/server';

const renderWithRouter = (component: React.ReactElement) => {
  return renderToString(
    <StaticRouter location="/">
      {component}
    </StaticRouter>
  );
};

describe('Layout', () => {
  it('renders the MicroTech brand', () => {
    const markup = renderWithRouter(<Layout><div>Test content</div></Layout>);
    expect(markup).toContain('MicroTech');
  });

  it('renders navigation links', () => {
    const markup = renderWithRouter(<Layout><div>Test content</div></Layout>);
    expect(markup).toContain('Home');
    expect(markup).toContain('Proposals');
    expect(markup).toContain('Recruiting');
  });
});
