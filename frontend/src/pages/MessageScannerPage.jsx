import React, { useState } from 'react';
import { 
  MessageSquare, Search, AlertCircle, ShieldAlert, 
  RefreshCw, Lock, Sparkles, Download, CheckCircle, Info 
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import ExplainabilityCard from '../components/ExplainabilityCard';
import ExportReportModal from '../components/ExportReportModal';

const PRESET_MESSAGES = [
  {
    label: 'Threat: OTP Harvesting',
    text: 'URGENT: Your SBI Bank account is suspended today! Share your OTP 48291 to verify and unblock immediately.'
  },
  {
    label: 'Threat: Electricity Cut',
    text: 'Dear Customer, Your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately pay on this link: http://electricity-bill-pay.xyz'
  },
  {
    label: 'Threat: KBC Lottery',
    text: 'Congratulations! You have won Rs 25,00,000 cash in KBC Jio Lucky Draw! Call manager Ramesh at 9876543210 to claim reward.'
  },
  {
    label: 'Threat: Task Fraud',
    text: 'Earn Rs 5,000 daily working from home! Like YouTube videos and get instant UPI payment. Contact @quick_crorepati on Telegram to start.'
  },
  {
    label: 'Legitimate: Order Update',
    text: 'Your package from Amazon has been delivered. Track your orders or review your purchase directly in the official Amazon app.'
  }
];

export default function MessageScannerPage() {
  const [message, setMessage] = useState('');
  const [saveRecord, setSaveRecord] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim()) {
      setError('Please paste an SMS, email, or message to analyze.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.scanMessage(message.trim(), saveRecord);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze message content.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to render interactive highlighted text
  const renderHighlightedText = () => {
    if (!result?.highlight_spans || result.highlight_spans.length === 0) {
      return <div className="text-slate-300 leading-relaxed font-sans">{message}</div>;
    }

    const spans = [...result.highlight_spans].sort((a, b) => a.start - b.start);
    const elements = [];
    let lastIdx = 0;

    spans.forEach((span, i) => {
      if (span.start > lastIdx) {
        elements.push(
          <span key={`text-${i}`}>{message.slice(lastIdx, span.start)}</span>
        );
      }
      elements.push(
        <mark
          key={`span-${i}`}
          title={`${span.indicator} (${span.severity})`}
          className="bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 px-1 py-0.5 rounded cursor-help font-semibold"
        >
          {message.slice(span.start, span.end)}
        </mark>
      );
      lastIdx = span.end;
    });

    if (lastIdx < message.length) {
      elements.push(
        <span key="text-end">{message.slice(lastIdx)}</span>
      );
    }

    return <div className="text-slate-200 leading-relaxed font-sans">{elements}</div>;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feature 02 • NLP Scam & Social Engineering Detector</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Scam Message & Email Analyzer
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Paste suspicious SMS texts, WhatsApp forwards, phishing emails, or unexpected payment requests. Evaluated with TF-IDF NLP classification and social engineering heuristics.
        </p>
      </div>

      {/* Input Card */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Paste Suspicious Message Text:
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. URGENT: Your bank account is locked today! Send your OTP to unblock..."
              className="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-sm font-sans text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Privacy toggle */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveRecord}
                onChange={(e) => setSaveRecord(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-violet-500"
              />
              <span>Store privacy-conscious scan record in history (masks OTPs & phones)</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing NLP Semantics...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze Message</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Test Examples:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_MESSAGES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMessage(p.text);
                  setError(null);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/60 hover:border-violet-500/40 transition-colors"
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
          {/* Top Score & Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <RiskGauge score={result.risk_score} category={result.risk_category} />
            </div>

            <div className="md:col-span-2 p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RiskBadge category={result.risk_category} score={result.risk_score} size="lg" />
                  <span className="text-xs font-mono text-slate-400">
                    ID: {result.scan_id || 'Ephemeral (Not Saved)'}
                  </span>
                </div>

                {/* Highlighted text preview */}
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Semantic Highlight Preview (Suspicious Phrases Highlighted):
                  </span>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    {renderHighlightedText()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    Engine: <strong className="text-slate-100">{result.detection_method}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    Model: <strong className="text-slate-100">{result.model_version}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Explainability findings */}
          <ExplainabilityCard
            explainability={result.explainability}
            findings={result.findings}
            modelProbability={result.model_probability}
            heuristicScore={result.heuristic_score}
          />

          {/* Actionable Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-400" />
                Actionable Defense & Emergency Guidance
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
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
