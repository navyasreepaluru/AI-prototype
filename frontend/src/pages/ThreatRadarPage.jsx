import React, { useState, useEffect } from 'react';
import { 
  Shield, PlusCircle, Search, ThumbsUp, AlertCircle, 
  CheckCircle2, Clock, Filter, Check, X, ShieldAlert, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'All', 'Phishing', 'Credential Harvesting', 'Financial Fraud',
  'Malware Distribution', 'Lottery Scam', 'Social Engineering', 'Impersonation'
];

const STATUSES = ['All', 'Pending', 'Under Review', 'Confirmed', 'Rejected'];

export default function ThreatRadarPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Submit Modal / Form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formData, setFormData] = useState({
    indicator: '',
    threat_category: 'Phishing',
    description: '',
    evidence_details: '',
    reporter_tag: 'Anonymous Researcher',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    const params = {};
    if (selectedStatus !== 'All') params.status = selectedStatus;
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (searchQuery.trim()) params.q = searchQuery.trim();

    api.getReports(params)
      .then(data => {
        setReports(data.reports || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load reports:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.indicator.trim()) {
      setSubmitError('Please enter a threat indicator (URL or suspicious text).');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await api.submitReport(formData);
      setSubmitSuccess(res.message);
      setFormData({
        indicator: '',
        threat_category: 'Phishing',
        description: '',
        evidence_details: '',
        reporter_tag: 'Anonymous Researcher',
      });
      fetchReports();
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitSuccess(null);
      }, 1800);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await api.upvoteReport(id);
      setReports(reports.map(r => r.id === id ? { ...r, upvotes: res.upvotes, confidence_score: res.confidence_score } : r));
    } catch (err) {
      console.error("Upvote failed:", err);
    }
  };

  const handleReview = async (id, newStatus) => {
    try {
      const res = await api.reviewReport(id, newStatus);
      setReports(reports.map(r => r.id === id ? { ...r, moderation_status: newStatus } : r));
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Under Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Rejected':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Feature 07 • Decentralized Threat Intel Feed</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Community Threat Radar
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Crowdsourced threat indicators validated through automated deduplication hashing and human-in-the-loop consensus moderation.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-violet-500/20 flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Threat</span>
        </button>
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
              onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              placeholder="Search threat reports by URL, domain, or description..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            onClick={fetchReports}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0"
          >
            Apply Search
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Status:</span>
            {STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedStatus === st
                    ? 'bg-violet-600 text-white font-semibold'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Displaying <strong>{reports.length}</strong> of <strong>{total}</strong> verified community records</span>
          <span>Anonymous contributions protected</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading threat reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0c1222] border border-[#1e293b] text-center text-slate-400 text-xs space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No community threat reports found matching the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-[#0c1222] border border-[#1e293b] hover:border-slate-700 transition-all shadow-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(rep.moderation_status)}`}>
                      {rep.moderation_status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {rep.threat_category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>by {rep.reporter_tag}</span>
                    <span>•</span>
                    <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Target Indicator */}
                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-rose-300 break-all border border-slate-800">
                  {rep.indicator}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {rep.description}
                </p>

                {rep.evidence_details && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <strong className="text-slate-300">Context/Evidence:</strong> {rep.evidence_details}
                  </div>
                )}

                {/* Bottom action toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpvote(rep.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Validate ({rep.upvotes})</span>
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">
                      Confidence: {(rep.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Moderation Controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Moderator Review:</span>
                    <button
                      onClick={() => handleReview(rep.id, 'Confirmed')}
                      title="Confirm threat"
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleReview(rep.id, 'Under Review')}
                      title="Mark under investigation"
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800 transition-colors"
                    >
                      Investigate
                    </button>
                    <button
                      onClick={() => handleReview(rep.id, 'Rejected')}
                      title="Reject false positive"
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0c1222] border border-[#1e293b] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-slate-100 text-base">Submit Suspicious Threat Indicator</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Indicator (URL or text snippet)*:
                </label>
                <input
                  type="text"
                  required
                  value={formData.indicator}
                  onChange={(e) => setFormData({ ...formData, indicator: e.target.value })}
                  placeholder="e.g. https://sbi-alert-verify.buzz or suspicious SMS message"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Threat Category*:
                </label>
                <select
                  value={formData.threat_category}
                  onChange={(e) => setFormData({ ...formData, threat_category: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Scam Mechanism:
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe how you encountered this threat (e.g. SMS received claiming electricity disconnection)..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reporter Tag (Anonymous Alias):
                </label>
                <input
                  type="text"
                  value={formData.reporter_tag}
                  onChange={(e) => setFormData({ ...formData, reporter_tag: e.target.value })}
                  placeholder="e.g. Anonymous Researcher #42"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold flex items-center gap-2 shadow-lg disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Threat Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
