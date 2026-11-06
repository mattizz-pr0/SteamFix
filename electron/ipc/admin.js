const store = require('./store');

function workerUrl() {
  return store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
}

function adminToken() {
  return store.get('adminToken') || '';
}

async function workerFetch(path, opts = {}) {
  const res = await fetch(`${workerUrl()}${path}`, {
    ...opts,
    headers: {
      'User-Agent': 'OnlineFixManager-App',
      ...(opts.headers || {})
    }
  });
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

function authHeaders() {
  const t = adminToken();
  if (!t) throw new Error('Admin token non impostato. Effettua il login.');
  return { 'Authorization': `Bearer ${t}` };
}

async function login(token) {
  const res = await fetch(`${workerUrl()}/api/admin/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'OnlineFixManager-App'
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (res.status === 401) throw new Error('Token admin non valido.');
  if (!res.ok) throw new Error(`Worker ${res.status}: ${json.error || text.slice(0, 200)}`);
  store.set('adminToken', token);
  return json;
}

function logout() {
  store.set('adminToken', '');
  return true;
}

function isLogged() {
  return !!adminToken();
}

async function status() {
  return await workerFetch('/api/admin/status', { headers: authHeaders() });
}


async function forceUpdate(appId) {
  const qs = new URLSearchParams({ app_id: String(appId) });
  // Aggiungi anche la API key HubcapDB dell'utente (quella salvata nelle Impostazioni)
  const userHubcapKey = (store.get('userHubcapApiKey') || '').trim();
  const headers = {
    ...authHeaders(),
    ...(userHubcapKey ? { 'X-Hubcap-Api-Key': userHubcapKey } : {})
  };
  return await workerFetch(`/api/github/force-update?${qs}`, { headers });
}

// --- token utente ---
async function createToken(name) {
  return await workerFetch('/api/admin/create-token', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
}

async function listTokens() {
  return await workerFetch('/api/admin/list-tokens', { headers: authHeaders() });
}

async function revealToken(tokenId) {
  return await workerFetch('/api/admin/reveal-token', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_id: tokenId })
  });
}

async function revokeToken(tokenId) {
  return await workerFetch('/api/admin/revoke-token', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_id: tokenId })
  });
}

async function removeToken(tokenId) {
  return await workerFetch('/api/admin/remove-token', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_id: tokenId })
  });
}

module.exports = {
  login, logout, isLogged,
  status,
  forceUpdate,
  createToken, listTokens, revealToken, revokeToken,
  removeToken
};