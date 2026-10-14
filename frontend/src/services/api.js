const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errData.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse),

  // Scans
  scanUrl: (url, saveRecord = true) =>
    fetch(`${API_BASE}/scan/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, save_record: saveRecord })
    }).then(handleResponse),

  scanMessage: (message, saveRecord = true) =>
    fetch(`${API_BASE}/scan/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, save_record: saveRecord })
    }).then(handleResponse),

  getScans: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.type) searchParams.set('type', params.type);
    if (params.category) searchParams.set('category', params.category);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    return fetch(`${API_BASE}/scans?${searchParams.toString()}`).then(handleResponse);
  },

  getScan: (id) => fetch(`${API_BASE}/scans/${id}`).then(handleResponse),

  deleteScan: (id) =>
    fetch(`${API_BASE}/scans/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Scam DNA Fingerprint
  compareFingerprint: (payload) =>
    fetch(`${API_BASE}/fingerprint/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // Threat Intelligence
  getThreats: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.type) searchParams.set('type', params.type);
    if (params.category) searchParams.set('category', params.category);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    return fetch(`${API_BASE}/threats?${searchParams.toString()}`).then(handleResponse);
  },

  getThreatSummary: () => fetch(`${API_BASE}/threats/summary`).then(handleResponse),

  // Community Threat Radar
  getReports: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.status) searchParams.set('status', params.status);
    if (params.category) searchParams.set('category', params.category);
    if (params.page) searchParams.set('page', params.page);
    if (params.limit) searchParams.set('limit', params.limit);
    return fetch(`${API_BASE}/reports?${searchParams.toString()}`).then(handleResponse);
  },

  submitReport: (payload) =>
    fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  reviewReport: (id, status) =>
    fetch(`${API_BASE}/reports/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(handleResponse),

  upvoteReport: (id) =>
    fetch(`${API_BASE}/reports/${id}/upvote`, { method: 'POST' }).then(handleResponse),

  // URL Anatomy & Safe Inspector
  getUrlAnatomy: (url) =>
    fetch(`${API_BASE}/url/anatomy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }).then(handleResponse),

  getAnatomyExamples: () => fetch(`${API_BASE}/url/anatomy/examples`).then(handleResponse),

  inspectUrlSafely: (url) =>
    fetch(`${API_BASE}/url/inspect-safe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }).then(handleResponse),

  // Dashboard & Analytics
  getDashboardSummary: () => fetch(`${API_BASE}/dashboard/summary`).then(handleResponse),
  getDashboardTrends: () => fetch(`${API_BASE}/dashboard/trends`).then(handleResponse),
  getModelInfo: () => fetch(`${API_BASE}/model/info`).then(handleResponse),

  // Feedback
  submitFeedback: (payload) =>
    fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse)
};
