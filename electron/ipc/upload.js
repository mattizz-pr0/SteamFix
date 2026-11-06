const store = require('./store');
const fs = require('fs');
const path = require('path');

function workerUrl() {
  return store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
}

function userToken() {
  return (store.get('userToken') || '').trim();
}

function clearLocalToken() {
  store.set('userToken', '');
}

/**
 * Controlla sul worker se il token locale è ancora valido.
 * Se revocato/eliminato, lo cancella dalla store locale.
 * @returns {Promise<{valid:boolean, reason?:string, name?:string}>}
 */
async function checkToken() {
  const token = userToken();
  if (!token) return { valid: false, reason: 'missing' };

  try {
    const res = await fetch(`${workerUrl()}/api/user/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'OnlineFixManager-App'
      }
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { valid: false, reason: 'parse' }; }

    if (!json.valid) {
      clearLocalToken();
      return { valid: false, reason: json.reason || 'revoked' };
    }
    return { valid: true, name: json.name || null };
  } catch (e) {
    // rete offline: non cancelliamo il token locale
    return { valid: false, reason: 'network', error: e.message, kept_local: true };
  }
}

/**
 * Carica un OnlineFix sul branch `online-fix` del repo.
 * @param {string} filePath - percorso assoluto del file da caricare
 * @returns {Promise<object>} - { success, file, size, overwritten, uploaded_by }
 */
async function uploadOnlineFix(filePath) {
  const token = userToken();
  if (!token) throw new Error('Token utente non impostato. Vai in Impostazioni → Accesso caricamento.');

  // Ricontrolla sempre sul server prima di caricare
  const chk = await checkToken();
  if (!chk.valid && !chk.kept_local) {
    const err = new Error('Token utente non valido o revocato');
    err.status = 401;
    throw err;
  }
  if (!chk.valid && chk.kept_local) {
    throw new Error(`Impossibile verificare il token (rete): ${chk.error || 'errore'}`);
  }

  if (!fs.existsSync(filePath)) throw new Error(`File non trovato: ${filePath}`);

  const fileName = path.basename(filePath);
  const buf = fs.readFileSync(filePath);

  if (buf.length === 0) throw new Error('File vuoto.');
  if (buf.length > 100 * 1024 * 1024) throw new Error(`File troppo grande (${(buf.length / 1024 / 1024).toFixed(1)} MB). Max 100 MB.`);

  const res = await fetch(`${workerUrl()}/api/github/upload-onlinefix`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Filename': fileName,
      'Content-Type': 'application/octet-stream',
      'User-Agent': 'OnlineFixManager-App'
    },
    body: buf
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    if (res.status === 401) clearLocalToken();
    const err = new Error(`Worker ${res.status}: ${json.error || json.detail || text.slice(0, 200)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

module.exports = { uploadOnlineFix, checkToken, clearLocalToken };
