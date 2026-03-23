import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import FindJob from './pages/FindJob';
import AnalysisDashboard from './pages/AnalysisDashboard';
import TopSkills from './pages/TopSkills';
import Consulting from './pages/Consulting';
import ChatWidget from './components/ChatWidget';

const App = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/find-job" element={<FindJob />} />
            <Route path="/analysis" element={<AnalysisDashboard />} />
            <Route path="/top-skills" element={<TopSkills />} />
            <Route path="/consulting" element={<Consulting />} />
          </Routes>
        </div>
        <Footer />
        <ChatWidget />
      </div>
    </Router>
  );
};

export default App;
