import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, Globe, MessageSquare, Microscope, Activity, 
  Database, Dna, History, GraduationCap, Info, Menu, X, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(res => setBackendHealthy(res.status === 'healthy'))
      .catch(() => setBackendHealthy(false));
  }, []);

  const navLinks = [
    { path: '/', label: 'Overview', icon: Activity },
    { path: '/scan/url', label: 'URL Scanner', icon: Globe },
    { path: '/scan/message', label: 'Scam Message', icon: MessageSquare },
    { path: '/anatomy', label: 'URL Anatomy', icon: Microscope },
    { path: '/radar', label: 'Threat Radar', icon: Shield },
    { path: '/intel', label: 'Threat Intel', icon: Database },
    { path: '/dna', label: 'Scam DNA', icon: Dna },
    { path: '/history', label: 'History', icon: History },
    { path: '/coach', label: 'Safety Coach', icon: GraduationCap },
    { path: '/about', label: 'About & ML', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
                  CyberShield AI
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/30 text-violet-300">
                  KALAM 2K26
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">AI Threat & Scam Detection</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Status */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${
                backendHealthy === true ? 'bg-emerald-400 animate-pulse' :
                backendHealthy === false ? 'bg-rose-500' : 'bg-amber-400'
              }`} />
              <span className="text-slate-400">
                {backendHealthy === true ? 'API Operational' :
                 backendHealthy === false ? 'API Degraded' : 'Checking API...'}
              </span>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0c1222] border-b border-[#1e293b] px-4 pt-2 pb-6 space-y-1">
          <div className="grid grid-cols-2 gap-2 pt-2 pb-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-1">
            <span>KALAM INNOVISTA 2K26</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Models Active
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
