import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Cpu, Info, ShieldAlert } from 'lucide-react';

export default function ExplainabilityCard({ explainability, findings, modelProbability, heuristicScore }) {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const findingsList = findings || [];

  return (
    <div className="bg-[#0c1222] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Explainable AI: Why was this flagged?
            </h3>
            <p className="text-xs text-slate-400">
              Transparent, evidence-based reasoning behind every detection factor
            </p>
          </div>
        </div>

        {/* Confidence & Model telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {modelProbability !== undefined && modelProbability !== null && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span className="text-slate-400">ML Prob:</span> {(modelProbability * 100).toFixed(1)}%
            </div>
          )}
          {heuristicScore !== undefined && heuristicScore !== null && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span className="text-slate-400">Rule Pts:</span> {heuristicScore}
            </div>
          )}
        </div>
      </div>

      {/* Summary Banner */}
      {explainability?.summary && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/30 text-cyan-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>{explainability.summary}</span>
        </div>
      )}

      {/* Findings Accordion */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Detected Threat Indicators ({findingsList.length})
        </div>

        {findingsList.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-slate-400 text-sm">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            No heuristic threat triggers matched this scan. The evaluated attributes appear benign.
          </div>
        ) : (
          findingsList.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#1e293b] rounded-xl bg-slate-900/40 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{item.indicator}</div>
                      {item.component && (
                        <div className="text-xs text-slate-400">Component: <span className="font-mono text-cyan-400">{item.component}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800/60 bg-slate-950/40 space-y-3 text-xs">
                    {item.evidence && (
                      <div>
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                          Concrete Evidence:
                        </span>
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-cyan-300">
                          {item.evidence}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Technical Reason:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.explanation}</p>
                    </div>

                    {item.verification_advice && (
                      <div className="p-2.5 rounded-lg bg-violet-950/20 border border-violet-800/30 text-violet-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-violet-200 mb-0.5">Recommended Safety Step:</strong>
                          {item.verification_advice}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Verification Steps from Explainability */}
      {explainability?.safe_verification_steps && explainability.safe_verification_steps.length > 0 && (
        <div className="border-t border-slate-800 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Safe Source Verification Guidelines
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explainability.safe_verification_steps.map((step, sIdx) => (
              <li key={sIdx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
