const store = require('./store');

function workerUrl() {
  return store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
}

function userHubcapKey() {
  return (store.get('userHubcapApiKey') || '').trim();
}

async function appDetails(appIds) {
  const cache = store.get('steamAppDetails') || {};
  const now = Date.now();
  const TTL = 1000 * 60 * 60 * 24 * 7;

  const result = {};
  const toFetch = [];

  for (const id of appIds) {
    const c = cache[id];
    if (c && c.t && (now - c.t) < TTL) {
      result[id] = c.data;
    } else {
      toFetch.push(id);
    }
  }

  if (toFetch.length) {
    const CHUNK = 50;
    for (let i = 0; i < toFetch.length; i += CHUNK) {
      const chunk = toFetch.slice(i, i + CHUNK);
      try {
        const u = `${workerUrl()}/api/steam/appdetails?app_ids=${chunk.join(',')}&lang=italian`;
        const headers = { 'User-Agent': 'SteamFixManager-App' };
        const key = userHubcapKey();
        if (key) headers['X-Hubcap-Api-Key'] = key;

        const res = await fetch(u, { headers });
        if (res.ok) {
          const body = await res.json();
          if (body.results) {
            for (const [id, info] of Object.entries(body.results)) {
              result[id] = info;
              if (info.name) cache[id] = { t: now, data: info };
            }
          }
        }
      } catch (e) {
        // ignora: verranno mostrati come "app_id XXX"
      }
    }
    store.set('steamAppDetails', cache);
  }

  return result;
}

module.exports = { appDetails };