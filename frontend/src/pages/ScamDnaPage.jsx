import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dna, Search, RefreshCw, AlertCircle, CheckCircle, ArrowRight, ShieldAlert, GitCommit } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function ScamDnaPage() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if query param fp was provided in URL
    const searchParams = new URLSearchParams(location.search);
    const fp = searchParams.get('fp');
    if (fp) {
      setQuery(fp);
      handleCompare(fp);
    }
  }, [location]);

  const handleCompare = async (targetQuery) => {
    const q = (targetQuery || query).trim();
    if (!q) {
      setError('Please provide a URL or a 64-character DNA hash to compare.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    const isHash = q.length === 64 && /^[a-fA-F0-9]+$/.test(q);
    const payload = isHash ? { fingerprint: q } : { url: q };

    try {
      const data = await api.compareFingerprint(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to compare Scam DNA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
          <Dna className="w-3.5 h-3.5" />
          <span>Feature 05 • Canonical Structural Hashing</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Scam DNA Fingerprint Comparison
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Generates deterministic SHA-256 hashes from normalized structural characteristics and threat indicators. Compare new targets against the database to discover coordinated phishing campaigns and template reuse.
        </p>
      </div>

      {/* Query Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleCompare(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Dna className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste a URL or a 64-char Scam DNA Fingerprint hash..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Matching DNA...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Compare Fingerprint</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Target DNA Hash */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Canonical DNA Hash
              </span>
              <span className="text-xs font-mono text-cyan-400">SHA-256 Normalized</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-violet-300 break-all border border-violet-900/30">
              {result.target_fingerprint}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {result.explanation}
            </p>
          </div>

          {/* Exact Matches List */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Exact Fingerprint Matches ({result.exact_matches_count})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">100% Structural Identity</span>
            </div>

            {result.exact_matches.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No exact duplicate fingerprints found in local database records.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {result.exact_matches.map((match) => (
                  <div key={match.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-mono text-xs text-cyan-300 break-all">
                        {match.input_preview}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {match.id.slice(0, 8)}... • Recorded {new Date(match.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <RiskBadge category={match.risk_category} score={match.risk_score} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Similar Structural Matches */}
          <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Correlated Structural Patterns ({result.similar_matches_count})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Cluster Similarity &gt;= 50%</span>
            </div>

            {result.similar_matches.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No similar structural threat templates identified.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {result.similar_matches.map((sim, i) => (
                  <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-mono text-xs text-slate-200 break-all">
                        {sim.scan.input_preview}
                      </div>
                      <div className="text-[11px] text-cyan-400">
                        {sim.match_reason}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                        Match: {Math.round(sim.similarity_score * 100)}%
                      </span>
                      <RiskBadge category={sim.scan.risk_category} score={sim.scan.risk_score} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
