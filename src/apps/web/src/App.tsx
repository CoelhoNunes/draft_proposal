import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { ProposalPage } from '@/pages/ProposalPage';
import { RecruitingPage } from '@/pages/RecruitingPage';

function App(): JSX.Element {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/proposal" element={<ProposalPage />} />
            <Route path="/recruiting" element={<RecruitingPage />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
