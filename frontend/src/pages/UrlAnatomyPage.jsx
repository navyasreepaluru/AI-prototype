import React, { useState, useEffect } from 'react';
import { 
  Microscope, Search, AlertCircle, ShieldCheck, 
  HelpCircle, Info, RefreshCw, Layers, ExternalLink 
} from 'lucide-react';
import { api } from '../services/api';

export default function UrlAnatomyPage() {
  const [url, setUrl] = useState('');
  const [examples, setExamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getAnatomyExamples()
      .then(data => setExamples(data.examples || []))
      .catch(err => console.error("Could not fetch anatomy examples:", err));
  }, []);

  const handleAnalyze = async (targetUrl) => {
    const queryUrl = (targetUrl || url).trim();
    if (!queryUrl) {
      setError('Please provide a URL to decompose and inspect.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.getUrlAnatomy(queryUrl);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to decompose URL anatomy.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBorder = (risk) => {
    switch (risk) {
      case 'Critical':
        return 'border-rose-500/60 bg-rose-950/20 text-rose-300';
      case 'High':
        return 'border-orange-500/60 bg-orange-950/20 text-orange-300';
      case 'Medium':
        return 'border-amber-500/60 bg-amber-950/20 text-amber-300';
      default:
        return 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
          <Microscope className="w-3.5 h-3.5" />
          <span>Feature 04 • Structural URL Deconstruction Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          URL Anatomy Visualizer
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Deconstruct web addresses into Scheme, Subdomain, Registered Domain (using the Public Suffix List), Port, Path, and Query parameters to reveal deceptive spoofing tactics.
        </p>
      </div>

      {/* Input & Preset Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Microscope className="w-4 h-4 text-emerald-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://paypal.com.verify-security-center.xyz:8080/auth/login?session_id=8921#confirm"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Parsing Anatomy...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Decompose URL</span>
              </>
            )}
          </button>
        </form>

        {/* Examples */}
        {examples.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select an educational phishing example:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    setUrl(ex.url);
                    handleAnalyze(ex.url);
                  }}
                  className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300">
                    {ex.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                    {ex.url}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Anatomy Breakdown View */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Visual Interactive URL Ribbon */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Visual Anatomy Map (Hover or Inspect Components)
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-1 font-mono text-sm break-all">
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30" title="Scheme / Protocol">
                {result.parsed_url.scheme}://
              </span>
              {result.parsed_url.subdomain && (
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30" title="Subdomain (Untrusted if spoofing brand)">
                  {result.parsed_url.subdomain}.
                </span>
              )}
              <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 font-bold" title="Registered Domain (Primary Identity)">
                {result.parsed_url.registered_domain}
              </span>
              {result.parsed_url.port && (
                <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30" title="Port">
                  :{result.parsed_url.port}
                </span>
              )}
              {result.parsed_url.path && result.parsed_url.path !== '/' && (
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700" title="Resource Path">
                  {result.parsed_url.path}
                </span>
              )}
              {result.parsed_url.query && Object.keys(result.parsed_url.query).length > 0 && (
                <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30" title="Query Parameters">
                  ?...
                </span>
              )}
              {result.parsed_url.fragment && (
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700" title="Fragment">
                  #{result.parsed_url.fragment}
                </span>
              )}
            </div>
          </div>

          {/* Component Deep Dives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.components.map((comp, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${getRiskBorder(comp.risk_level)} shadow-md space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    {comp.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-current font-mono">
                    {comp.risk_level} Risk
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 font-mono text-xs text-slate-100 break-all border border-slate-900">
                  {typeof comp.value === 'object' ? JSON.stringify(comp.value) : comp.value}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {comp.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Educational Takeaway Banner */}
          <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-cyan-200 shadow-xl flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 block mb-1 font-semibold">Important Security Principle:</strong>
              {result.educational_takeaway}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
