import React, { useState, useEffect } from 'react';
import { Database, Search, ShieldAlert, CheckCircle, ExternalLink, Filter, Layers, Server } from 'lucide-react';
import { api } from '../services/api';

export default function ThreatIntelPage() {
  const [threats, setThreats] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [intelMode, setIntelMode] = useState('Local Intelligence');
  const [adapterStatus, setAdapterStatus] = useState('Disabled');

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedCategory) params.category = selectedCategory;
    const loadData = () => {
  setLoading(true);
  if (selectedType) params.type = selectedType;

  Promise.all([
    api.getThreats(params),
    api.getThreatSummary()
  ]).then(([threatData, sumData]) => {
    setThreats(threatData.threats || []);
    setTotal(threatData.total || 0);
    setIntelMode(threatData.intel_mode || 'Local Intelligence');
    setAdapterStatus(threatData.external_adapter_status || 'Disconnected');
    setSummary(sumData);
    setLoading(false);
  }).catch(err => {
    console.error("Threat intel fetch error:", err);
    // --- MOCK DATA FOR DEMO WHEN BACKEND IS OFF ---
    setThreats([
      { id: 1, url: 'http://suspicious-phish.com', type: 'Phishing', risk: 'High' },
      { id: 2, url: 'http://malware-test.net', type: 'Malware Distribution', risk: 'Critical' },
      { id: 3, url: 'http://lottery-scam.win', type: 'Lottery Scam', risk: 'Medium' },
    ]);
    setTotal(127);
    setIntelMode('Demo Mode (Offline)');
    setAdapterStatus('Demo Data');
    setSummary({
      total_scans: 127,
      threats_blocked: 42,
      // THIS IS FOR YOUR GRAPHS - 7-Day Activity
      threat_activity: [
        { date: 'Mon', total: 20, threats: 5 },
        { date: 'Tue', total: 35, threats: 12 },
        { date: 'Wed', total: 30, threats: 8 },
        { date: 'Thu', total: 50, threats: 20 },
        { date: 'Fri', total: 45, threats: 15 },
        { date: 'Sat', total: 65, threats: 28 },
        { date: 'Sun', total: 80, threats: 35 },
      ],
      // THIS IS FOR RISK PIE CHART
      risk_distribution: [
        { name: 'Safe', value: 65 },
        { name: 'Suspicious', value: 22 },
        { name: 'Malicious', value: 13 },
      ]
    });
    setLoading(false);
  });
};

  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedType]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
          <Database className="w-3.5 h-3.5" />
          <span>Feature 06 • Threat Intelligence Integration</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Threat Intelligence Repository
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Curated threat indicators, verified phishing hosts, and confirmed community consensus feeds. Operates in high-assurance local intelligence mode with optional external reputation adapters.
        </p>
      </div>

      {/* Mode & Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Intelligence Engine</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Autonomous Local Threat Intelligence</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fast, zero-latency matching against vetted malicious domains, IP infrastructure, scam templates, and community moderation consensus.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">External API Adapter</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              adapterStatus.includes('Active') ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {adapterStatus}
            </span>
          </div>
          <div className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-400" />
            <span>Google Safe Browsing v4 Adapter</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configurable adapter architecture. Reads credentials exclusively from server-side environment variables. Safely disabled when API keys are absent.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              placeholder="Search threat indicators (e.g. sbi, paypal, 185.220, electricity)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0"
          >
            Search Intel
          </button>
        </div>

        {summary && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Indicator Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
              >
                <option value="">All Types</option>
                {Object.keys(summary.by_type || {}).map(t => (
                  <option key={t} value={t}>{t} ({summary.by_type[t]})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Threat Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
              >
                <option value="">All Categories</option>
                {Object.keys(summary.by_category || {}).map(c => (
                  <option key={c} value={c}>{c} ({summary.by_category[c]})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Threats Table / Cards */}
      <div className="space-y-3">
        <div className="text-xs text-slate-400 px-1">
          Showing <strong>{threats.length}</strong> of <strong>{total}</strong> active indicators
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading threat intelligence...</div>
        ) : threats.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e293b] text-center text-slate-400 text-xs">
            No indicators match the specified query filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threats.map((ti) => (
              <div
                key={ti.id}
                className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                    {ti.indicator_type}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                    {ti.threat_category}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-rose-300 break-all border border-slate-800">
                  {ti.indicator_value}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {ti.evidence}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                  <span>Source: {ti.source}</span>
                  <span>Confidence: {(ti.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
