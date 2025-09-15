const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

async function handleResponse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const data = await res.json(); msg = data.detail || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

export async function analyze({ type, value, file }) {
  const url = `${BASE_URL}/analyze`;
  let res;
  if (type === 'file' && file) {
    const form = new FormData();
    form.append('file', file);
    res = await fetch(url, { method: 'POST', body: form });
  } else if (type === 'url') {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value }) });
  } else {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: value }) });
  }
  return handleResponse(res);
}

export async function getMetricsSummary() {
  const res = await fetch(`${BASE_URL}/metrics/summary`);
  return handleResponse(res);
}

export async function getMetricsTimeseries(days = 7) {
  const res = await fetch(`${BASE_URL}/metrics/timeseries?days=${days}`);
  return handleResponse(res);
}

export function setApiBase(url) {
  (window)._apiBase = url; // opcional para depuración
}
