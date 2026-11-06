const store = require('./store');

function workerUrl() {
  return store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
}

function userHubcapKey() {
  return (store.get('userHubcapApiKey') || '').trim();
}

async function workerFetch(path, opts = {}) {
  const headers = {
    'User-Agent': 'SteamFixManager-App',
    ...(opts.headers || {})
  };
  const key = userHubcapKey();
  if (key) headers['X-Hubcap-Api-Key'] = key;

  const res = await fetch(`${workerUrl()}${path}`, { ...opts, headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Worker ${res.status}: ${json.error || json.message || text.slice(0, 200)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function listBranches() {
  const r = await workerFetch('/api/github/branches');
  return r.branches.map(b => b.name);
}

async function listFiles(branch, { search = '', limit = 0 } = {}) {
  const qs = new URLSearchParams({ branch, search, limit: String(limit) });
  const r = await workerFetch(`/api/github/files?${qs}`);
  return r.files || [];
}

async function syncGame(appId) {
  const qs = new URLSearchParams({ app_id: String(appId) });
  return await workerFetch(`/api/github/sync-game?${qs}`);
}

async function info() {
  return await workerFetch('/api/github/info');
}

async function download({ branch, remotePath, destPath }) {
  const url = `${workerUrl()}/api/github/download?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(remotePath)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SteamFixManager-App' } });
  if (!res.ok) {
    let errMsg = `Worker ${res.status}`;
    try {
      const j = await res.json();
      errMsg += `: ${j.error || j.message || ''}`;
    } catch {
      const t = await res.text();
      errMsg += `: ${t.slice(0, 200)}`;
    }
    throw new Error(errMsg);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const fs = require('fs');
  const pathMod = require('path');
  fs.mkdirSync(pathMod.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return { destPath, size: buf.length };
}

module.exports = { listBranches, listFiles, syncGame, info, download };