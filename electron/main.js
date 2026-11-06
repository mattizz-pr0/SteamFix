const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, exec } = require('child_process');
const store = require('./ipc/store');
const github = require('./ipc/github');
const hubcap = require('./ipc/hubcap');
const admin = require('./ipc/admin');
const upload = require('./ipc/upload');
const steamfix = require('./ipc/steamfix');
const updater = require('./ipc/updater');
const steam = require('./ipc/steam');

const STEAM_STPLUGIN = 'C:\\Program Files (x86)\\Steam\\config\\stplug-in';
const STEAM_DEPOTCACHE = 'C:\\Program Files (x86)\\Steam\\config\\depotcache';

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    title: "SteamFix Manager",
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1116',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

function registerIpc() {
  ipcMain.handle('app:ping',    () => 'pong');
  ipcMain.handle('app:version', () => app.getVersion());

  ipcMain.handle('store:get', (_e, key)        => store.get(key));
  ipcMain.handle('store:set', (_e, key, value) => { store.set(key, value); return true; });
  ipcMain.handle('store:all', ()               => store.all());

  ipcMain.handle('github:listBranches', ()             => github.listBranches());
  ipcMain.handle('github:listFiles',    (_e, b, opts)  => github.listFiles(b, opts));
  ipcMain.handle('github:syncGame',     (_e, appId)    => github.syncGame(appId));
  ipcMain.handle('github:info',         ()             => github.info());
  ipcMain.handle('github:download',     (_e, args)     => github.download(args));

  ipcMain.handle('hubcap:search', (_e, params) => hubcap.search(params));
  ipcMain.handle('hubcap:library', (_e, params) => hubcap.library(params)); 
  ipcMain.handle('hubcap:r2CheckBatch', (_e, ids) => hubcap.r2CheckBatch(ids));   
  ipcMain.handle('hubcap:status', (_e, appId)  => hubcap.status(appId));
  ipcMain.handle('hubcap:statusBatch', (_e, ids) => hubcap.statusBatch(ids));
  ipcMain.handle('hubcap:userStats', () => hubcap.userStats());
  ipcMain.handle('hubcapKey:test',  (_e, key) => hubcap.testKey(key));
  ipcMain.handle('hubcapKey:save',  (_e, key) => hubcap.saveKey(key));
  ipcMain.handle('hubcapKey:get',   ()       => hubcap.getKey());

  ipcMain.handle('admin:login',   (_e, token)   => admin.login(token));
  ipcMain.handle('admin:logout',  ()            => admin.logout());
  ipcMain.handle('admin:isLogged',()            => admin.isLogged());
  ipcMain.handle('admin:status',  ()            => admin.status());
  ipcMain.handle('admin:forceUpdate',  (_e, id) => admin.forceUpdate(id));
  ipcMain.handle('admin:createToken', (_e, name) => admin.createToken(name));
  ipcMain.handle('admin:listTokens',  ()        => admin.listTokens());
  ipcMain.handle('admin:revealToken', (_e, id)  => admin.revealToken(id));
  ipcMain.handle('admin:revokeToken', (_e, id)  => admin.revokeToken(id));
  ipcMain.handle('admin:removeToken', (_e, id)  => admin.removeToken(id));
  ipcMain.handle('upload:onlinefix',  (_e, filePath) => upload.uploadOnlineFix(filePath));
  ipcMain.handle('upload:checkToken',   ()             => upload.checkToken());
  

  ipcMain.handle('steamfix:run', () => steamfix.run());

  ipcMain.handle('dialog:saveFile', async (_e, defaultName) => {
    const win = BrowserWindow.getFocusedWindow();
    const res = await dialog.showSaveDialog(win, {
      title: 'Salva file',
      defaultPath: defaultName || 'download.zip',
      filters: [{ name: 'Zip', extensions: ['zip'] }]
    });
    return res.canceled ? null : res.filePath;
  });

    // --- auto-update ---
  ipcMain.handle('updater:check', () => updater.check(app.getVersion()));

  ipcMain.handle('updater:download', async (_e, version) => {
    const win = BrowserWindow.getFocusedWindow();
    try {
      const dest = await updater.download(version, (pct) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('updater:progress', { version, percent: pct });
        }
      });
      return { ok: true, path: dest };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle('updater:install', async (_e, filePath) => {
    const result = await updater.install(filePath);
    if (result.ok) {
      // aspetta 3 secondi prima di chiudere (l'installer deve partire)
      setTimeout(() => {
        app.quit();
      }, 3000);
    }
    return result;
  });

  
    ipcMain.handle('dialog:openExternal', async (_e, url) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return true;
  });

    ipcMain.handle('dialog:openFile', async (_e) => {
    const win = BrowserWindow.getFocusedWindow();
    const res = await dialog.showOpenDialog(win, {
      title: 'Seleziona file OnlineFix',
      properties: ['openFile'],
      filters: [
        { name: 'Archivi', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] },
        { name: 'Tutti i file', extensions: ['*'] }
      ]
    });
    return res.canceled || !res.filePaths.length ? null : res.filePaths[0];
  });

  // ---------- STEAM TOOLS ----------

  ipcMain.handle('steam:listInstalled', () => {
    const readDir = (dir) => {
      try {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).map(name => {
          const full = path.join(dir, name);
          const stat = fs.statSync(full);
          return { name, size: stat.size, mtime: stat.mtimeMs };
        });
      } catch (e) {
        return [];
      }
    };
    return {
      stplugIn: { dir: STEAM_STPLUGIN, files: readDir(STEAM_STPLUGIN) },
      depotCache: { dir: STEAM_DEPOTCACHE, files: readDir(STEAM_DEPOTCACHE) }
    };
  });

  // Installa un gioco direttamente in SteamTools (con UAC)
  ipcMain.handle('steam:installGame', async (_e, appId) => {
    // 1) scarica lo zip da GitHub
    const workerUrl = store.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
    const url = `${workerUrl}/api/github/download?branch=games&path=${encodeURIComponent(appId + '.zip')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    // 2) salva zip in temp
    const tmpZip = path.join(os.tmpdir(), `ofm_${appId}_${Date.now()}.zip`);
    fs.writeFileSync(tmpZip, buf);

    // 3) estrai in una cartella temporanea separata
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(tmpZip);
    const tmpExtract = path.join(os.tmpdir(), `ofm_extract_${appId}_${Date.now()}`);
    fs.mkdirSync(tmpExtract, { recursive: true });
    zip.extractAllTo(tmpExtract, true);

    // 4) prepara la lista di cosa copiare dove
    const files = fs.readdirSync(tmpExtract);
    const luaFiles = files.filter(f => f.toLowerCase().endsWith('.lua'));
    const manifestFiles = files.filter(f => f.toLowerCase().endsWith('.manifest'));

    // 5) script PowerShell per copiare i file (con UAC)
    const psLines = [];
    psLines.push(`$ErrorActionPreference = 'Stop'`);
    for (const f of luaFiles) {
      const src = path.join(tmpExtract, f).replace(/\\/g, '\\\\');
      const dst = path.join(STEAM_STPLUGIN, f).replace(/\\/g, '\\\\');
      psLines.push(`Copy-Item -LiteralPath "${src}" -Destination "${dst}" -Force`);
    }
    for (const f of manifestFiles) {
      const src = path.join(tmpExtract, f).replace(/\\/g, '\\\\');
      const dst = path.join(STEAM_DEPOTCACHE, f).replace(/\\/g, '\\\\');
      psLines.push(`Copy-Item -LiteralPath "${src}" -Destination "${dst}" -Force`);
    }

    const script = psLines.join('; ');
    const encoded = Buffer.from(script, 'utf16le').toString('base64');

    // 6) esegui elevato
    const result = await runElevatedPowershell(encoded);

    // 7) pulisci temp
    try { fs.unlinkSync(tmpZip); } catch {}
    try { fs.rmSync(tmpExtract, { recursive: true, force: true }); } catch {}

    if (!result.ok) {
      throw new Error(result.error || 'Installazione fallita (UAC negato?)');
    }

    return {
      ok: true,
      luaCopied: luaFiles.length,
      manifestsCopied: manifestFiles.length
    };
  });

    // Installa un gioco da uno zip scaricato dal worker
  // (stessa logica di installGame ma senza richiedere il file già in locale)
  ipcMain.handle('steam:installFromWorker', async (_e, appId) => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const AdmZip = require('adm-zip');
    const storeModule = require('./ipc/store');

    const STEAM_STPLUGIN = 'C:\\Program Files (x86)\\Steam\\config\\stplug-in';
    const STEAM_DEPOTCACHE = 'C:\\Program Files (x86)\\Steam\\config\\depotcache';

    // 1) scarica lo zip dal worker
    const workerUrl = storeModule.get('workerUrl') || 'https://onlinefix-proxy.reveng3r.workers.dev';
    const url = `${workerUrl}/api/github/download?branch=games&path=${encodeURIComponent(appId + '.zip')}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'SteamFixManager-App' } });
    if (!res.ok) throw new Error(`Download ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());

    // 2) salva in temp
    const tmpZip = path.join(os.tmpdir(), `ofm_${appId}_${Date.now()}.zip`);
    fs.writeFileSync(tmpZip, buf);

    // 3) estrai
    const tmpExtract = path.join(os.tmpdir(), `ofm_extract_${appId}_${Date.now()}`);
    fs.mkdirSync(tmpExtract, { recursive: true });
    const zip = new AdmZip(tmpZip);
    zip.extractAllTo(tmpExtract, true);

    // 4) prepara lista file da copiare
    const files = fs.readdirSync(tmpExtract);
    const luaFiles = files.filter(f => f.toLowerCase().endsWith('.lua'));
    const manifestFiles = files.filter(f => f.toLowerCase().endsWith('.manifest'));

    // 5) script PowerShell per copiare (con UAC)
    const psLines = [];
    psLines.push(`$ErrorActionPreference = 'Stop'`);
    for (const f of luaFiles) {
      const src = path.join(tmpExtract, f).replace(/\\/g, '\\\\');
      const dst = path.join(STEAM_STPLUGIN, f).replace(/\\/g, '\\\\');
      psLines.push(`Copy-Item -LiteralPath "${src}" -Destination "${dst}" -Force`);
    }
    for (const f of manifestFiles) {
      const src = path.join(tmpExtract, f).replace(/\\/g, '\\\\');
      const dst = path.join(STEAM_DEPOTCACHE, f).replace(/\\/g, '\\\\');
      psLines.push(`Copy-Item -LiteralPath "${src}" -Destination "${dst}" -Force`);
    }

    const script = psLines.join('; ');
    const encoded = Buffer.from(script, 'utf16le').toString('base64');

    const result = await runElevatedPowershell(encoded);

    // 6) pulizia temp
    try { fs.unlinkSync(tmpZip); } catch {}
    try { fs.rmSync(tmpExtract, { recursive: true, force: true }); } catch {}

    if (!result.ok) {
      throw new Error(result.error || 'Installazione fallita (UAC negato?)');
    }

    return {
      ok: true,
      luaCopied: luaFiles.length,
      manifestsCopied: manifestFiles.length
    };
  });

  // Rimuovi un gioco da SteamTools (con UAC)
  ipcMain.handle('steam:removeGame', async (_e, appId) => {
    // leggi il .lua per trovare i manifest collegati
    const luaPath = path.join(STEAM_STPLUGIN, `${appId}.lua`);
    let manifestNames = [];
    if (fs.existsSync(luaPath)) {
      try {
        const content = fs.readFileSync(luaPath, 'utf8');
        // il lua contiene righe tipo setManifestid(732, "75942...", 8) o addappid
        // i nomi dei manifest nel depotcache sono <depot_id>_<gid>.manifest o <gid>.manifest
        // leggo tutti i .manifest in depotcache e cancello quelli che matchano la lista
        const manifestDir = STEAM_DEPOTCACHE;
        if (fs.existsSync(manifestDir)) {
          const allManifests = fs.readdirSync(manifestDir).filter(f => f.endsWith('.manifest'));
          // estrai tutti i numeri dal lua
          const nums = new Set();
          const matches = content.match(/\d{6,}/g) || [];
          for (const n of matches) nums.add(n);
          for (const mf of allManifests) {
            const parts = mf.replace(/\.manifest$/, '').split('_');
            for (const p of parts) {
              if (nums.has(p)) { manifestNames.push(mf); break; }
            }
          }
        }
      } catch (e) {
        // se qualcosa va storto, rimuovo solo il lua
      }
    }

    const psLines = [];
    psLines.push(`$ErrorActionPreference = 'SilentlyContinue'`);
    psLines.push(`Remove-Item -LiteralPath "${luaPath.replace(/\\/g, '\\\\')}" -Force`);
    for (const mf of manifestNames) {
      const full = path.join(STEAM_DEPOTCACHE, mf).replace(/\\/g, '\\\\');
      psLines.push(`Remove-Item -LiteralPath "${full}" -Force`);
    }
    const script = psLines.join('; ');
    const encoded = Buffer.from(script, 'utf16le').toString('base64');

    const result = await runElevatedPowershell(encoded);

    return {
      ok: result.ok,
      luaRemoved: fs.existsSync(luaPath) === false,
      manifestsRemoved: manifestNames.length,
      error: result.error
    };
  });

  ipcMain.handle('steam:openFolder', (_e, folderPath) => {
    const { shell } = require('electron');
    shell.openPath(folderPath);
    return true;
  });

  ipcMain.handle('steam:appDetails', (_e, ids) => steam.appDetails(ids));
  ipcMain.handle('steam:restartSteam', async () => {
    return await new Promise((resolve) => {
      // 1) kill steam
      exec('taskkill /F /IM steam.exe /T', (err) => {
        // anche se taskkill fallisce (Steam già chiuso), proseguo
        // 2) attesa 2 secondi
        setTimeout(() => {
          // 3) riavvia Steam
          // cerco l'exe in percorsi comuni
          const candidates = [
            'C:\\Program Files (x86)\\Steam\\steam.exe',
            'C:\\Program Files\\Steam\\steam.exe'
          ];
          const found = candidates.find(p => fs.existsSync(p));
          if (!found) {
            resolve({ ok: false, error: 'Steam.exe non trovato nei percorsi standard' });
            return;
          }
          const child = spawn(found, [], { detached: true, stdio: 'ignore' });
          child.unref();
          resolve({ ok: true });
        }, 2000);
      });
    });
  });
}

// Esegue uno script PowerShell con privilegi elevati (UAC)
function runElevatedPowershell(encodedScript) {
  return new Promise((resolve) => {
    const cmd = [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-Command',
      `try { Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedScript}'; exit 0 } catch { exit 1 }`
    ];
    const p = spawn('powershell.exe', cmd, { windowsHide: true });
    let err = '';
    p.stderr.on('data', d => err += d.toString());
    p.on('close', code => {
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: err || `Exit code ${code} (UAC negato?)` });
    });
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  // cancella eventuali MSI vecchi in %TEMP%
  try {
    const updater = require('./ipc/updater');
    if (typeof updater.cleanOldUpdates === 'function') {
      updater.cleanOldUpdates();
    }
  } catch (e) {
    console.error('[startup] cleanOldUpdates:', e);
  }

  // verifica key HubcapDB all'avvio
  setTimeout(() => {
    checkHubcapKeyOnStartup();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.setName("SteamFix Manager");

// --- All'avvio: verifica se la key HubcapDB è ancora valida ---
async function checkHubcapKeyOnStartup() {
  const store = require('./ipc/store');
  const key = (store.get('userHubcapApiKey') || '').trim();
  if (!key) return; // nessuna key, niente da verificare

  try {
    const res = await fetch('https://hubcapmanifest.com/api/v1/user/stats', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'User-Agent': 'SteamFixManager-App'
      }
    });
    if (res.status === 401) {
      // key scaduta o revocata → cancella
      store.set('userHubcapApiKey', '');
      console.log('[startup] Key HubcapDB scaduta, rimossa automaticamente.');
    } else {
      console.log('[startup] Key HubcapDB valida.');
    }
  } catch (e) {
    console.log('[startup] Impossibile verificare la key:', e.message);
    // Non cancelliamo la key se è solo un problema di rete
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});