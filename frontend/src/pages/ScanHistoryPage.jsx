import React, { useState, useEffect } from 'react';
import { 
  History, Search, Trash2, Eye, Download, AlertCircle, 
  Filter, CheckCircle, RefreshCw, X 
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import ExportReportModal from '../components/ExportReportModal';
import ExplainabilityCard from '../components/ExplainabilityCard';

export default function ScanHistoryPage() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);

  // Detail Modal
  const [activeScan, setActiveScan] = useState(null);
  const [loadingActiveScan, setLoadingActiveScan] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchScans = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedType) params.type = selectedType;
    if (selectedCategory) params.category = selectedCategory;

    api.getScans(params)
      .then(data => {
        setScans(data.scans || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load history:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScans();
  }, [page, selectedType, selectedCategory]);

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this scan record from history?")) return;
    try {
      await api.deleteScan(id);
      setScans(scans.filter(s => s.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      if (activeScan?.id === id) setActiveScan(null);
    } catch (err) {
      alert("Failed to delete scan: " + err.message);
    }
  };

  const handleOpenDetail = async (id) => {
    setLoadingActiveScan(true);
    try {
      const data = await api.getScan(id);
      setActiveScan(data);
    } catch (err) {
      alert("Failed to load scan details: " + err.message);
    } finally {
      setLoadingActiveScan(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
          <History className="w-3.5 h-3.5" />
          <span>Feature 11 • Auditable Scan Records</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Scan History & Detailed Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Search, filter, and inspect previous URL scans and message analyses. Export verified security audit reports or purge retained records at your discretion.
        </p>
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
              onKeyDown={(e) => e.key === 'Enter' && fetchScans()}
              placeholder="Search history by evaluated URL or message preview..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => { setPage(1); fetchScans(); }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0"
          >
            Apply Filters
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="url">URL Scans</option>
              <option value="message">Message Scans</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Risk Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Total records: <strong>{total}</strong></span>
          <span>Sensitive values masked before storage</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading historical scans...</div>
        ) : scans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e293b] text-center text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No historical scans found. Run a URL or message scan to generate audit records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#0c1222] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Evaluated Target (Sanitized)</th>
                  <th className="py-3 px-4">Threat Risk</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {scans.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                        {s.scan_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono max-w-xs truncate text-slate-200">
                      {s.input_preview}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge category={s.risk_category} score={s.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenDetail(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/40 transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {total > 15 && (
          <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
            <span>Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Scan View Modal */}
      {activeScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0c1222] border border-[#1e293b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RiskBadge category={activeScan.risk_category} score={activeScan.risk_score} size="md" />
                <div>
                  <h3 className="font-bold text-slate-100 text-base">Historical Audit Report</h3>
                  <span className="text-[11px] font-mono text-slate-400">ID: {activeScan.id}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveScan(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Target info */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Evaluated Target Preview:
                </span>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 break-all border border-slate-800">
                  {activeScan.input_preview}
                </div>
              </div>

              {/* Explainability component */}
              <ExplainabilityCard
                explainability={activeScan.explainability}
                findings={activeScan.findings}
                modelProbability={activeScan.model_probability}
                heuristicScore={activeScan.heuristic_score}
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => handleDelete(activeScan.id)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 text-xs font-medium border border-rose-900/40 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Export Report File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Report File Modal */}
      {showExportModal && activeScan && (
        <ExportReportModal
          scanData={activeScan}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
