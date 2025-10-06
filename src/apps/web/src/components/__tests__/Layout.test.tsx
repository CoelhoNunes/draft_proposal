import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Layout', () => {
  it('renders the MicroTech brand', () => {
    renderWithRouter(<Layout><div>Test content</div></Layout>);
    expect(screen.getByText('MicroTech')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Layout><div>Test content</div></Layout>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Recruiting')).toBeInTheDocument();
  });
});
