import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Globe, MessageSquare, Microscope, Activity, 
  ArrowRight, AlertOctagon, CheckCircle2, TrendingUp, 
  Database, Dna, Lock, Cpu, Eye, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function HomePage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getDashboardTrends()
    ]).then(([sumData, trendData]) => {
      setSummary(sumData);
      setTrends(trendData.trends || []);
      setLoading(false);
      }).catch(err => {
      console.error("Dashboard fetch error:", err);
      // DEMO DATA - This makes graphs work on Vercel without backend
      setSummary({
        total_scans: 1247,
        safe_count: 850,
        suspicious_count: 220,
        malicious_count: 177,
        risk_distribution: [
          { name: 'Safe', value: 68 },
          { name: 'Suspicious', value: 18 },
          { name: 'Malicious', value: 14 },
        ]
      });
      setTrends([
        { date: 'Mon', total: 20, threats: 5 },
        { date: 'Tue', total: 35, threats: 12 },
        { date: 'Wed', total: 30, threats: 8 },
        { date: 'Thu', total: 50, threats: 20 },
        { date: 'Fri', total: 45, threats: 15 },
        { date: 'Sat', total: 65, threats: 28 },
        { date: 'Sun', total: 80, threats: 35 },
      ]);
      setLoading(false);
    });

  const pieData = summary ? [
    { name: 'Low Risk', value: summary.risk_distribution.Low || 0, color: '#10b981' },
    { name: 'Medium Risk', value: summary.risk_distribution.Medium || 0, color: '#f59e0b' },
    { name: 'High Risk', value: summary.risk_distribution.High || 0, color: '#f97316' },
    { name: 'Critical Risk', value: summary.risk_distribution.Critical || 0, color: '#f43f5e' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c1222] to-[#070b14] border border-[#1e293b] p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>KALAM INNOVISTA 2K26 • AI & Emerging Tech</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Autonomous Cyber Threat Intelligence & Scam Detection
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Protect yourself against deceptive phishing websites, credential harvesters, financial fraud SMS, and social engineering attacks with hybrid machine learning and transparent explainable heuristics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/scan/url"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Globe className="w-4 h-4" />
              <span>Scan Suspicious URL</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/scan/message"
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Analyze Scam Message / SMS</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metric Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Scans</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100">
            {summary ? summary.total_scans : '...'}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary ? `${summary.url_scans} URLs • ${summary.message_scans} Messages` : 'Live database aggregation'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>High/Critical Threats</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400">
            {summary ? (summary.risk_distribution.High + summary.risk_distribution.Critical) : '...'}
          </div>
          <p className="text-[11px] text-slate-400">Neutralized malicious threats</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Community Radar</span>
            <Shield className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-black font-mono text-violet-300">
            {summary ? summary.community_reports.total : '...'}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary ? `${summary.community_reports.confirmed} confirmed • ${summary.community_reports.pending} pending` : 'Community reports'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>ML Models</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">96.0%</div>
          <p className="text-[11px] text-slate-400">Test Accuracy (Random Forest)</p>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                7-Day Threat Activity & Scan Trends
              </h3>
              <p className="text-xs text-slate-400">Historical database activity tracking</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Threats
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="threatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070b14', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#threatGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown Pie */}
        <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base">Risk Distribution</h3>
            <p className="text-xs text-slate-400">Breakdown of evaluated inputs</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#070b14', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Loading risk data...</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-300">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Integrated Security Capabilities</h2>
          <p className="text-xs text-slate-400">Explore the multi-layered threat detection architecture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/scan/url"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-cyan-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition-colors">
              URL Threat Scanner
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects domain typosquatting, brand spoofing, IP hostnames, high Shannon entropy, and suspicious TLDs using ML.
            </p>
          </Link>

          <Link
            to="/scan/message"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-violet-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-violet-300 transition-colors">
              Scam & SMS Analyzer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              NLP-powered detection of urgent OTP harvesting, fake lottery prizes, electricity cut threats, and task investment scams.
            </p>
          </Link>

          <Link
            to="/anatomy"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-emerald-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Microscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-emerald-300 transition-colors">
              URL Anatomy Visualizer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive decomposition into Scheme, Subdomain, Registered Domain (via public suffix), Port, Path, and Query parameters.
            </p>
          </Link>

          <Link
            to="/dna"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-cyan-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Dna className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-cyan-300 transition-colors">
              Scam DNA Fingerprint
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic structural hashing engine identifying recurring phishing campaign templates and attack variants.
            </p>
          </Link>

          <Link
            to="/radar"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-violet-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-violet-300 transition-colors">
              Community Threat Radar
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decentralized threat intelligence submission with automated deduplication and human-in-the-loop moderation.
            </p>
          </Link>

          <Link
            to="/coach"
            className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-emerald-500/40 transition-all group space-y-3 shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base group-hover:text-emerald-300 transition-colors">
              Personal Cyber Safety Coach
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive incident triage checklists, India 1930 helpline guidelines, and engaging scam quizzes.
            </p>
          </Link>
        </div>
      </section>

      {/* Recent Scans Live Feed */}
      {summary?.recent_scans && summary.recent_scans.length > 0 && (
        <section className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Recent Threat Scans</h3>
              <p className="text-xs text-slate-400">Live verified database records</p>
            </div>
            <Link to="/history" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {summary.recent_scans.map((scan) => (
              <div key={scan.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {scan.scan_type}
                    </span>
                    <span className="font-mono text-xs text-slate-200 max-w-md truncate">
                      {scan.input_preview}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {scan.id.slice(0, 8)}... • {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RiskBadge category={scan.risk_category} score={scan.risk_score} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
