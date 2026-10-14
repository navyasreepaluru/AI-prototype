import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import UrlScannerPage from './pages/UrlScannerPage';
import MessageScannerPage from './pages/MessageScannerPage';
import UrlAnatomyPage from './pages/UrlAnatomyPage';
import ThreatRadarPage from './pages/ThreatRadarPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import ScamDnaPage from './pages/ScamDnaPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import SafetyCoachPage from './pages/SafetyCoachPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan/url" element={<UrlScannerPage />} />
          <Route path="/scan/message" element={<MessageScannerPage />} />
          <Route path="/anatomy" element={<UrlAnatomyPage />} />
          <Route path="/radar" element={<ThreatRadarPage />} />
          <Route path="/intel" element={<ThreatIntelPage />} />
          <Route path="/dna" element={<ScamDnaPage />} />
          <Route path="/history" element={<ScanHistoryPage />} />
          <Route path="/coach" element={<SafetyCoachPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
