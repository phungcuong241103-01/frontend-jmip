import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import FindJob from './pages/FindJob';
import AnalysisDashboard from './pages/AnalysisDashboard';
import TopSkills from './pages/TopSkills';
import Consulting from './pages/Consulting';
import ChatWidget from './components/ChatWidget';

const AppContent = () => {
  const location = useLocation();
  const hideFooter = location.pathname === '/analysis';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className={hideFooter ? '' : 'flex-grow'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/find-job" element={<FindJob />} />
          <Route path="/analysis" element={<AnalysisDashboard />} />
          <Route path="/top-skills" element={<TopSkills />} />
          <Route path="/consulting" element={<Consulting />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
      <ChatWidget />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
