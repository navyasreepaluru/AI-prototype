import React, { useState } from 'react';
import { 
  Globe, Search, AlertCircle, CheckCircle, ShieldCheck, 
  ExternalLink, Download, Dna, Lock, Server, RefreshCw, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import ExplainabilityCard from '../components/ExplainabilityCard';
import ExportReportModal from '../components/ExportReportModal';

const PRESET_URLS = [
  { label: 'Legitimate: Google', url: 'https://www.google.com' },
  { label: 'Phishing: PayPal Lookalike', url: 'https://paypal.com.verify-security-center.xyz/auth/login' },
  { label: 'Threat: Raw IP Host', url: 'http://185.220.101.4:8080/secure/sbi-netbanking/login.php' },
  { label: 'Threat: BoA Free TLD', url: 'http://bankofamerica-urgent-login.tk/auth' },
  { label: 'Threat: SBI KYC Scam', url: 'https://sbi-kyc-mandatory-update.buzz/pan-card-link' },
];

export default function UrlScannerPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Safe Inspector state
  const [inspectingSafe, setInspectingSafe] = useState(false);
  const [safeInspectionData, setSafeInspectionData] = useState(null);

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a website URL to scan.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setSafeInspectionData(null);

    try {
      const data = await api.scanUrl(url.trim(), true);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to complete URL scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSafeInspect = async () => {
    if (!result?.url) return;
    setInspectingSafe(true);
    try {
      const data = await api.inspectUrlSafely(result.url);
      setSafeInspectionData(data);
    } catch (err) {
      setError('Inspection failed: ' + err.message);
    } finally {
      setInspectingSafe(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
          <Globe className="w-3.5 h-3.5" />
          <span>Feature 01 • Neural URL Threat Scanner</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          AI-Powered URL Security Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Evaluates domain structure, brand typosquatting, subdomains, Shannon entropy, IP hosts, and known threat feeds using our trained Random Forest classifier.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://paypal.com.verify-security.xyz/auth/login or http://185.220.101.4"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing URL...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run Deep Scan</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Presets */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Test Examples:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_URLS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrl(p.url);
                  setError(null);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/60 hover:border-cyan-500/40 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <RiskGauge score={result.risk_score} category={result.risk_category} />
            </div>

            <div className="md:col-span-2 p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RiskBadge category={result.risk_category} score={result.risk_score} size="lg" />
                  <span className="text-xs font-mono text-slate-400">
                    ID: {result.scan_id || 'Ephemeral'}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Analyzed Destination Target:
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 break-all border border-slate-800">
                    {result.input_preview}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    Engine: <strong className="text-slate-100">{result.detection_method}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    Model: <strong className="text-slate-100">{result.model_version}</strong>
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSafeInspect}
                  disabled={inspectingSafe}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Server className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{inspectingSafe ? 'Checking Server...' : 'Safe SSRF Network Inspect'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Safe Inspection Result Card (SSRF Protected) */}
          {safeInspectionData && (
            <div className="p-5 rounded-2xl bg-[#0c1222] border border-cyan-900/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Safe Network & SSRF Inspection Result</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  safeInspectionData.allowed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {safeInspectionData.allowed ? 'Safe Public Target' : 'SSRF Restricted'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Resolved IP(s)</span>
                  <span className="font-mono text-slate-200">
                    {safeInspectionData.resolved_ips?.join(', ') || 'Blocked / None'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">HTTP Status Code</span>
                  <span className="font-mono text-slate-200">{safeInspectionData.status_code || 'N/A (HEAD only)'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Server Software</span>
                  <span className="font-mono text-slate-200">{safeInspectionData.server_header || 'Undisclosed'}</span>
                </div>
              </div>

              {safeInspectionData.reason && (
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/30 text-rose-300 text-xs">
                  {safeInspectionData.reason}
                </div>
              )}

              {safeInspectionData.ssl_certificate && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">SSL Certificate Telemetry</span>
                  <div className="text-slate-300">
                    Issuer: <strong>{safeInspectionData.ssl_certificate.issuer_organization || safeInspectionData.ssl_certificate.issuer_common_name}</strong>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Valid through: {safeInspectionData.ssl_certificate.expires_at || 'N/A'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Explainability Section */}
          <ExplainabilityCard
            explainability={result.explainability}
            findings={result.findings}
            modelProbability={result.model_probability}
            heuristicScore={result.heuristic_score}
          />

          {/* Scam DNA Fingerprint Preview */}
          {result.dna_fingerprint && (
            <div className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Scam DNA Fingerprint Generated</h3>
                </div>
                <a
                  href={`#/dna?fp=${result.dna_fingerprint}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Compare DNA in Database</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-violet-300 break-all border border-violet-900/30">
                {result.dna_fingerprint}
              </div>
              <p className="text-[11px] text-slate-400">
                Deterministic SHA-256 canonical structural hash representing normalized host characteristics, path depth, parameter layout, and threat vectors.
              </p>
            </div>
          )}

          {/* Recommendations Block */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Recommended Next Steps & Security Protocol
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && result && (
        <ExportReportModal
          scanData={result}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
