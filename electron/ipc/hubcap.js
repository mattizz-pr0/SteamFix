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

async function search({ q, limit = 50, appid = false } = {}) {
  if (!q || q.length < 3) throw new Error('Query minima 3 caratteri.');
  const qs = new URLSearchParams({ q, limit: String(limit), appid: appid ? 'true' : 'false' });
  return await workerFetch(`/api/hubcap/search?${qs}`);
}

async function library({ search = '', sort_by = 'updated' } = {}) {
  const qs = new URLSearchParams({ search, sort_by });
  return await workerFetch(`/api/hubcap/library-all?${qs}`);
}

async function status(appId) {
  const qs = new URLSearchParams({ app_id: String(appId) });
  return await workerFetch(`/api/hubcap/status?${qs}`);
}

async function statusBatch(appIds) {
  const cache = store.get('gameNames') || {};
  const now = Date.now();
  const CACHE_TTL = 1000 * 60 * 60 * 24;

  const toFetch = [];
  const result = {};
  for (const id of appIds) {
    const cached = cache[id];
    if (cached && cached.name && (now - (cached.t || 0)) < CACHE_TTL) {
      result[id] = { app_id: id, game_name: cached.name };
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length) {
    const CHUNK = 50;
    for (let i = 0; i < toFetch.length; i += CHUNK) {
      const chunk = toFetch.slice(i, i + CHUNK);
      try {
        const r = await workerFetch(`/api/hubcap/status-batch?app_ids=${chunk.join(',')}`);
        if (r.results) {
          for (const [id, info] of Object.entries(r.results)) {
            result[id] = info;
            if (info.game_name) cache[id] = { name: info.game_name, t: now };
          }
        }
      } catch (e) {
        for (const id of chunk) {
          if (!result[id]) result[id] = { app_id: id, game_name: null, error: e.message };
        }
      }
    }
    store.set('gameNames', cache);
  }

  return result;
}

// --- Verifica e salva API key ---
async function testKey(apiKey) {
  const key = (apiKey || '').trim();
  if (!key) throw new Error('API key vuota.');

  const res = await fetch('https://hubcapmanifest.com/api/v1/user/stats', {
    headers: {
      'Authorization': `Bearer ${key}`,
      'User-Agent': 'SteamFixManager-App'
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Key non valida (${res.status}): ${json.detail || json.error || text.slice(0, 150)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function saveKey(apiKey) {
  store.set('userHubcapApiKey', (apiKey || '').trim());
  return true;
}

function getKey() {
  return userHubcapKey();
}

async function userStats() {
  return await workerFetch('/api/hubcap/user-stats');
}

async function r2CheckBatch(ids) {
  if (!ids || !ids.length) return { results: {} };
  const qs = new URLSearchParams({ bucket: 'games', ids: ids.join(',') });
  return await workerFetch(`/api/r2/check-batch?${qs}`);
}

module.exports = { search, library, status, statusBatch, userStats, testKey, saveKey, getKey, r2CheckBatch};