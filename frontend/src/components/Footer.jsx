import React from 'react';
import { Shield, ExternalLink, Heart, PhoneCall, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#050810] border-t border-[#1e293b] text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand and Event */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-100">CyberShield AI</span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Developed for <strong className="text-cyan-300">KALAM INNOVISTA 2K26 Model Innovation Challenge</strong> under the 
              <em> AI & Emerging Technologies</em> domain. Real-time URL threat detection, social engineering NLP analysis, and Scam DNA fingerprinting.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <span>Stack: React • Vite • Python Flask • Scikit-learn • SQLite</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform Features
            </div>
            <ul className="space-y-1.5">
              <li><Link to="/scan/url" className="hover:text-cyan-400 transition-colors">URL Threat Scanner</Link></li>
              <li><Link to="/scan/message" className="hover:text-cyan-400 transition-colors">Scam Message & SMS Analyzer</Link></li>
              <li><Link to="/anatomy" className="hover:text-cyan-400 transition-colors">URL Anatomy Visualizer</Link></li>
              <li><Link to="/radar" className="hover:text-cyan-400 transition-colors">Community Threat Radar</Link></li>
              <li><Link to="/dna" className="hover:text-cyan-400 transition-colors">Scam DNA Fingerprint</Link></li>
            </ul>
          </div>

          {/* Official Indian Reporting Channels */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              National Reporting Hotlines
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Helpline: 1930</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Citizen Financial Cyber Fraud Reporting Management System (CFMS). Call immediately after fraudulent fund transfer.
              </p>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
              >
                cybercrime.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            © 2026 CyberShield AI. Designed for ethical cybersecurity awareness and automated threat detection.
          </p>
          <div className="flex items-center gap-1">
            <span>Built with precision for Kalam Innovista 2K26</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
