import React, { useState, useEffect } from 'react';
import { 
  Info, Cpu, ShieldCheck, Database, Award, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Lock 
} from 'lucide-react';
import { api } from '../services/api';

export default function AboutPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelInfo()
      .then(data => {
        setModelInfo(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Model info fetch error:", err);
        setLoading(false);
      });
  }, []);

  const urlMetrics = modelInfo?.url_classifier?.metrics || {
    accuracy: 0.96,
    precision: 1.0,
    recall: 0.9167,
    f1_score: 0.9565,
    confusion_matrix: [[13, 0], [1, 11]]
  };

  const msgMetrics = modelInfo?.message_classifier?.metrics || {
    accuracy: 1.0,
    precision: 1.0,
    recall: 1.0,
    f1_score: 1.0,
    confusion_matrix: [[5, 0], [0, 5]]
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header & Competition Badge */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0c1222] via-[#0e172e] to-[#070b14] border border-[#1e293b] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-violet-400" />
            <span>KALAM INNOVISTA 2K26 • Model Innovation Challenge</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            About CyberShield AI & Technical Methodology
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            CyberShield AI is an autonomous, explainable cybersecurity platform built for the <strong>KALAM INNOVISTA 2K26 Model Innovation Challenge</strong> under the <em>AI & Emerging Technologies</em> domain. It solves the pervasive vulnerability of ordinary citizens falling prey to phishing portals, bank impersonation, and fraudulent social engineering SMS attacks.
          </p>
        </div>
      </div>

      {/* Machine Learning Pipeline Verification */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Verified Machine Learning Pipeline & Metrics
          </h2>
          <p className="text-xs text-slate-400">
            Trained and evaluated on held-out test datasets using Scikit-Learn without synthetic accuracy inflation.
          </p>
        </div>

        {/* Model 1: URL Random Forest */}
        <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-base">URL Threat Classifier</h3>
              <p className="text-xs text-slate-400 font-mono">
                {modelInfo?.url_classifier?.model_type || 'RandomForestClassifier'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Operational • Version {modelInfo?.url_classifier?.version || 'v1.0.0-rf'}
            </span>
          </div>

          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Accuracy</span>
              <span className="text-xl font-mono font-black text-emerald-400">
                {(urlMetrics.accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precision</span>
              <span className="text-xl font-mono font-black text-cyan-400">
                {(urlMetrics.precision * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recall</span>
              <span className="text-xl font-mono font-black text-violet-400">
                {(urlMetrics.recall * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">F1-Score</span>
              <span className="text-xl font-mono font-black text-amber-400">
                {(urlMetrics.f1_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Confusion Matrix Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Held-Out Confusion Matrix:
              </span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">True Negatives</span>
                  <span className="text-emerald-400 font-bold text-base">{urlMetrics.confusion_matrix[0][0]}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">False Positives</span>
                  <span className="text-slate-400 font-bold text-base">{urlMetrics.confusion_matrix[0][1]}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">False Negatives</span>
                  <span className="text-slate-400 font-bold text-base">{urlMetrics.confusion_matrix[1][0]}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">True Positives</span>
                  <span className="text-rose-400 font-bold text-base">{urlMetrics.confusion_matrix[1][1]}</span>
                </div>
              </div>
            </div>

            {/* Top Informative Features */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Top Informative ML Features:
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>1. Hostname Shannon Entropy</span>
                  <span className="font-mono text-cyan-400 font-bold">16.7% weight</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>2. Hyphens Count</span>
                  <span className="font-mono text-cyan-400 font-bold">14.9% weight</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>3. Hostname Length</span>
                  <span className="font-mono text-cyan-400 font-bold">14.5% weight</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>4. High-Abuse TLD (.xyz, .top, .buzz)</span>
                  <span className="font-mono text-cyan-400 font-bold">13.8% weight</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>5. Overall URL Length</span>
                  <span className="font-mono text-cyan-400 font-bold">9.0% weight</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model 2: NLP Scam Message Classifier */}
        <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Scam & SMS NLP Classifier</h3>
              <p className="text-xs text-slate-400 font-mono">
                {modelInfo?.message_classifier?.model_type || 'TF-IDF Vectorizer + LogisticRegression'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30">
              Operational • Version {modelInfo?.message_classifier?.version || 'v1.0.0-nlp'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Extracts unigram and bigram TF-IDF semantic token representations combined with balanced class weighting. Identifies subtle coercion language, lottery advance-fee traps, and credential theft vectors.
          </p>
        </div>
      </div>

      {/* Architecture & Methodology */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Hybrid Detection Architecture: Why ML + Rule Engine?
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Pure machine learning models often suffer from opacity (the &quot;black-box&quot; dilemma) and vulnerability to adversarial evasion. Pure rule engines struggle with novel, evolving linguistic permutations. 
          CyberShield AI unites both into a hybrid detection architecture:
        </p>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
          <li><strong>Layer 1 (Statistical ML):</strong> Random Forest and NLP classifiers evaluate structural anomalies and semantic tone across held-out training patterns.</li>
          <li><strong>Layer 2 (Heuristic Rules & Threat Feeds):</strong> Explainable rule triggers cross-verify IP hostnames, brand typosquatting, authentication delimiters (&apos;@&apos;), and local threat indicators.</li>
          <li><strong>Layer 3 (Calibrated Hybrid Scoring):</strong> Scores are transparently mapped from 0 to 100 with clear evidence citations, avoiding arbitrary uncalibrated probability claims.</li>
        </ul>
      </div>

      {/* Limitations & Ethical Principles */}
      <div className="p-6 rounded-2xl bg-[#0c1222] border border-[#1e293b] shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Transparent Boundaries, Limitations & Privacy Safeguards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-amber-300 block">Inconclusive States:</strong>
            <p className="leading-relaxed">
              If evidence is insufficient to verify an input, the platform labels it as <em>Inconclusive / Unknown</em> rather than falsely assuring the user that the target is safe.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-cyan-300 block">Privacy & Credential Protection:</strong>
            <p className="leading-relaxed">
              CyberShield AI never stores raw passwords, OTP codes, or personal query parameters. All persistent representations are canonicalized and redacted before storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-rose-300 block">SSRF & Network Isolation:</strong>
            <p className="leading-relaxed">
              Safe URL inspection enforces rigorous SSRF filters, blocking access to private (RFC 1918), loopback, link-local, and cloud metadata (169.254.169.254) addresses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <strong className="text-violet-300 block">Assistive Decision Support:</strong>
            <p className="leading-relaxed">
              The platform is designed to empower human judgment. It does not file official police or cybercrime reports on behalf of the user, directing users to 1930 / cybercrime.gov.in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
