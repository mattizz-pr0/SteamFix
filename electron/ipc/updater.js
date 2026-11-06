const store = require('./store');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

function workerUrl() {
  return store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
}

/**
 * Controlla se ci sono aggiornamenti disponibili.
 * @returns {Promise<object>} { updateAvailable, current, latest, notes, asset, ... }
 */
async function check(currentVersion) {
  const current = currentVersion || require('../../package.json').version;
  try {
    const res = await fetch(
      `${workerUrl()}/api/updates/latest?current=${encodeURIComponent(current)}`,
      { headers: { 'User-Agent': 'SteamFixManager-App' } }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Worker ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    return data;
  } catch (e) {
    return {
      updateAvailable: false,
      current,
      error: e.message
    };
  }
}

/**
 * Scarica l'MSI dell'ultima versione tramite il worker.
 * @param {string} version - es. "1.0.1"
 * @param {function} onProgress - callback (percentuale 0-100)
 * @returns {Promise<string>} - percorso del file scaricato
 */
async function download(version, onProgress) {
  const url = `${workerUrl()}/api/updates/download?version=${encodeURIComponent(version)}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'SteamFixManager-App' } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Download fallito ${res.status}: ${txt.slice(0, 200)}`);
  }

  // estrai il nome file dall'header Content-Disposition
  let filename = `SteamFixManager-${version}.exe`;
  const cd = res.headers.get('content-disposition') || '';
  const m = cd.match(/filename="?([^"]+)"?/i);
  if (m && m[1]) filename = m[1];

  const total = parseInt(res.headers.get('content-length') || '0', 10);
  const dest = path.join(os.tmpdir(), filename);

  const fileStream = fs.createWriteStream(dest);
  let received = 0;

  if (res.body) {
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fileStream.write(Buffer.from(value));
      received += value.length;
      if (total > 0 && typeof onProgress === 'function') {
        onProgress(Math.round((received / total) * 100));
      }
    }
    fileStream.end();
    await new Promise(resolve => fileStream.on('finish', resolve));
  } else {
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    if (typeof onProgress === 'function') onProgress(100);
  }

  return dest;
}

/**
 * Esegue l'installer scaricato (.exe NSIS o .msi in fallback).
 * L'app viene chiusa SUBITO dopo aver lanciato l'installer.
 * @param {string} filePath - percorso del file .exe o .msi
 */
async function install(filePath) {
  const { shell } = require('electron');
  const path = require('path');

  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `File non trovato: ${filePath}` };
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.exe') {
      // .exe NSIS: usa shell.openPath (come doppio click dell'utente)
      const err = await shell.openPath(filePath);
      if (err) {
        return { ok: false, error: `Impossibile avviare l'installer: ${err}` };
      }
      return { ok: true };
    }

    if (ext === '.msi') {
      // .msi: usa msiexec
      const { spawn } = require('child_process');
      const child = spawn('msiexec', ['/i', filePath, '/qb'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();
      return { ok: true };
    }

    return { ok: false, error: `Estensione non riconosciuta: ${ext}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Cancella tutti i file SteamFixManager-*.msi vecchi nella cartella temp.
 * Da chiamare all'avvio dell'app.
 */
function cleanOldUpdates() {
  try {
    const tmp = os.tmpdir();
    const files = fs.readdirSync(tmp);
    let deleted = 0;
    for (const f of files) {
      if (f.startsWith('SteamFixManager-') && f.endsWith('.msi')) {
        try {
          fs.unlinkSync(path.join(tmp, f));
          deleted++;
        } catch {}
      }
    }
    if (deleted > 0) console.log(`[updater] Cancellati ${deleted} file MSI vecchi da ${tmp}`);
    return deleted;
  } catch (e) {
    console.error('[updater] Errore cleanOldUpdates:', e.message);
    return 0;
  }
}

module.exports = { check, download, install, cleanOldUpdates };
