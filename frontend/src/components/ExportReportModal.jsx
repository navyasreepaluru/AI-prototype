import React from 'react';
import { Download, Printer, X, Shield, FileText, Check } from 'lucide-react';

export default function ExportReportModal({ scanData, onClose }) {
  if (!scanData) return null;

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scanData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cybershield-report-${scanData.id || 'scan'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">CyberShield Threat Intelligence Report</h3>
              <p className="text-xs text-slate-400">Scan ID: <span className="font-mono text-cyan-400">{scanData.id || scanData.scan_id || 'N/A'}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content Preview */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Metadata Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Category</span>
              <span className="text-sm font-bold text-slate-200">{scanData.risk_category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Score</span>
              <span className="text-sm font-mono font-bold text-cyan-400">{scanData.risk_score} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Scan Type</span>
              <span className="text-sm font-bold text-slate-200 uppercase">{scanData.scan_type || 'URL'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Timestamp</span>
              <span className="text-xs font-mono text-slate-300">{new Date(scanData.created_at || scanData.scanned_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Input Preview */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Evaluated Target / Representation:
            </span>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 break-all border border-slate-800">
              {scanData.input_preview || scanData.url}
            </div>
          </div>

          {/* DNA Hash */}
          {scanData.dna_fingerprint && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Scam DNA Fingerprint Hash:
              </span>
              <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-violet-300 break-all border border-violet-900/40">
                {scanData.dna_fingerprint}
              </div>
            </div>
          )}

          {/* Findings Summary */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Security Findings ({scanData.findings?.length || 0}):
            </span>
            <div className="space-y-2">
              {scanData.findings?.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200">{f.indicator}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Actionable Defense Recommendations:
            </span>
            <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
              {scanData.recommendations?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={printReport}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
          <button
            onClick={downloadJson}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}
