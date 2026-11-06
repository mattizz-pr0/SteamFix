(() => {
  "use strict";

  // ============================================================
  //  ONLINE FIX MANAGER — app.js
  // ============================================================

  const view = document.getElementById("view");
  const navButtons = document.querySelectorAll(".nav-btn");
  const navIndicator = document.getElementById("nav-indicator");
  const fixSteamBtn = document.getElementById("fix-steam");
  const toastStack = document.getElementById("toast-stack");
  const versionEl = document.getElementById("version");

  // ---------- utils ----------
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  function fmtSize(bytes) {
    if (!bytes) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0, n = bytes;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 ? 1 : 0)} ${u[i]}`;
  }
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  const COVER_GRADIENTS = [
    ["#3d6bff", "#7a5cff"],
    ["#ff9f1c", "#ff5c7a"],
    ["#33d17a", "#3ddcff"],
    ["#ff5c7a", "#7a5cff"],
    ["#3ddcff", "#3d6bff"],
    ["#ffd23d", "#ff9f1c"]
  ];
  function coverStyle(name) {
    const [a, b] = COVER_GRADIENTS[hash(String(name)) % COVER_GRADIENTS.length];
    return `background: linear-gradient(135deg, ${a}, ${b});`;
  }

  // ---------- toast ----------
  function toast(message, kind = "info") {
    const node = document.createElement("div");
    node.className = "toast" + (kind === "ok" ? " ok" : "");
    node.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
    toastStack.appendChild(node);
    setTimeout(() => {
      node.classList.add("leave");
      node.addEventListener("animationend", () => node.remove(), { once: true });
    }, 3200);
  }

  // ---------- nav indicator ----------
function moveIndicator(btn) {
  if (!btn) return;

  const nav = document.getElementById('nav');
  if (!nav || !nav.contains(btn)) {
    // pulsante fuori dal nav (Impostazioni): nascondi
    navIndicator.style.opacity = '0';
    return;
  }

  // pulsante nel nav: mostra + anima
  navIndicator.style.opacity = '1';
  navIndicator.style.height = btn.offsetHeight + "px";
  navIndicator.style.transform = `translateY(${btn.offsetTop}px)`;
}
  // ============================================================
  //  VIEWS
  // ============================================================
  const views = {

    // ---------------- LIBRERIA ----------------
    library: {
      render: async () => `
        <div class="view-header">
          <div>
            <h2>La mia Libreria</h2>
            <p class="lede">Giochi installati in Steam\\config\\stplug-in</p>
          </div>
          <div style="display:flex;gap:8px;">
            <input class="search-input" id="lib-q" type="text" placeholder="Cerca per nome o app_id…" />
            <button class="btn ghost" id="lib-refresh" type="button">⟳ Aggiorna</button>
            <button class="btn" id="lib-restart-steam" type="button">🔄 Riavvia Steam</button>
          </div>
        </div>
        <div id="lib-status" style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;min-height:20px;font-family:var(--font-mono);"></div>
        <div id="lib-list"></div>
      `,
      afterRender: () => {
        const q = document.getElementById("lib-q");
        const refresh = document.getElementById("lib-refresh");
        const restart = document.getElementById("lib-restart-steam");
        const status = document.getElementById("lib-status");
        const list = document.getElementById("lib-list");

        let games = [];

        const setStatus = (txt, color = "var(--text-dim)") => {
          status.style.color = color;
          status.textContent = txt;
        };

        const renderList = () => {
          const filter = q.value.trim().toLowerCase();
          const filtered = filter
            ? games.filter(g =>
                g.appId.includes(filter) ||
                (g.gameName && g.gameName.toLowerCase().includes(filter))
              )
            : games;

          if (!filtered.length) {
            list.innerHTML = `<div class="empty">Nessun gioco trovato.</div>`;
            return;
          }

          list.innerHTML = `
            <div class="row-list">
              ${filtered.map(g => `
                <div class="row-item">
                  <div class="row-icon" style="${coverStyle(g.gameName || g.appId)};width:64px;height:32px;background-size:cover;background-position:center;${g.headerImage ? `background-image:url('${escapeHtml(g.headerImage)}')` : ''}">
                    ${g.headerImage ? '' : escapeHtml((g.gameName || g.appId)[0] || '?')}
                  </div>
                  <div class="row-main">
                    <h4>${g.gameName ? escapeHtml(g.gameName) : `<span style="color:var(--text-dim);">app_id ${escapeHtml(g.appId)}</span>`}</h4>
                    <div class="row-meta">
                      <span>${escapeHtml(g.appId)}</span>
                      <span>${escapeHtml(g.luaName)}</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn small lib-update-btn" data-id="${escapeHtml(g.appId)}" type="button">⬆ Aggiorna</button>
                    <button class="btn small ghost lib-remove-btn" data-id="${escapeHtml(g.appId)}" type="button">🗑 Elimina</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;

          list.querySelectorAll(".lib-update-btn").forEach(b => {
            b.addEventListener("click", () => doUpdate(b));
          });
          list.querySelectorAll(".lib-remove-btn").forEach(b => {
            b.addEventListener("click", () => doRemove(b));
          });
        };

        const load = async () => {
          setStatus("⏳ Leggo cartella SteamTools...");
          list.innerHTML = "";
          try {
            const data = await window.api.steam.listInstalled();
            const luaFiles = (data.stplugIn.files || []).filter(f => f.name.endsWith(".lua"));
            games = luaFiles.map(f => ({
              appId: f.name.replace(/\.lua$/i, ""),
              luaName: f.name,
              mtime: f.mtime,
              gameName: null,
              headerImage: null
            }));
            const mfCount = (data.depotCache.files || []).length;
            setStatus(`${games.length} giochi · ${mfCount} manifest · carico nomi...`);
            renderList();

            const ids = games.map(g => g.appId);
            if (ids.length) {
              try {
                const details = await window.api.steam.appDetails(ids);
                for (const g of games) {
                  const d = details[g.appId];
                  if (d) {
                    if (d.name) g.gameName = d.name;
                    if (d.header_image) g.headerImage = d.header_image;
                  }
                }
                setStatus(`${games.length} giochi · ${mfCount} manifest`);
                renderList();
              } catch (e) {
                setStatus(`${games.length} giochi · nomi non disponibili: ${e.message}`, "var(--signal)");
              }
            }
          } catch (e) {
            setStatus(`❌ ${e.message}`, "#ff7a7a");
          }
        };

        const doUpdate = async (btn) => {
          const id = btn.dataset.id;
          btn.disabled = true; btn.textContent = "⏳...";
          try {
            setStatus(`⏳ Sync ${id} su GitHub...`);
            const r = await window.api.github.syncGame(id);
            if (r.action === "unavailable" || r.action === "error") {
              throw new Error(formatSyncMessage(r));
            }
            if (r.action === "created") {
              await new Promise(res => setTimeout(res, 4000));
            }
            setStatus("⏳ Installazione in SteamTools (UAC)...");
            const res = await window.api.steam.installGame(id);
            setStatus(`✅ Installati: ${res.luaCopied} .lua, ${res.manifestsCopied} .manifest`, "var(--success)");
            toast(`Installati ${res.luaCopied} .lua, ${res.manifestsCopied} .manifest`, "ok");
          } catch (e) {
            setStatus(`❌ ${e.message}`, "#ff7a7a");
            toast(e.message);
          } finally {
            btn.disabled = false; btn.textContent = "⬆ Aggiorna";
          }
        };

        const doRemove = async (btn) => {
          const id = btn.dataset.id;
          const ok = await showConfirm({
            title: "Eliminare il gioco?",
            message: `Verranno rimossi .lua e .manifest collegati per app_id ${id}.`,
            confirmText: "Elimina",
            danger: true
          });
          if (!ok) return;
          btn.disabled = true; btn.textContent = "⏳...";
          try {
            setStatus(`⏳ Rimozione ${id} (UAC)...`);
            const res = await window.api.steam.removeGame(id);
            if (!res.ok) throw new Error(res.error || "Rimozione fallita");
            setStatus(`✅ Rimosso: ${res.manifestsRemoved} manifest`, "var(--success)");
            toast(`Rimossi ${res.manifestsRemoved} manifest`, "ok");
            await load();
          } catch (e) {
            setStatus(`❌ ${e.message}`, "#ff7a7a");
            toast(e.message);
          } finally {
            btn.disabled = false; btn.textContent = "🗑 Elimina";
          }
        };

        restart.addEventListener("click", async () => {
          const ok = await showConfirm({
            title: "Riavviare Steam?",
            message: "Steam verrà chiuso e riaperto automaticamente.",
            confirmText: "Riavvia"
          });
          if (!ok) return;
          setStatus("⏳ Riavvio Steam...");
          const res = await window.api.steam.restartSteam();
          if (res.ok) { setStatus("✅ Steam riavviato", "var(--success)"); toast("Steam riavviato", "ok"); }
          else { setStatus(`❌ ${res.error}`, "#ff7a7a"); toast(res.error); }
        });

        q.addEventListener("input", renderList);
        refresh.addEventListener("click", load);
        load();
      }
    },

    // ---------------- DOWNLOAD ----------------
        download: {
      render: async () => {
        const cfg = await window.api.store.all();
        const hasKey = !!(cfg.userHubcapApiKey && cfg.userHubcapApiKey.trim());

        if (!hasKey) {
          return `
            <div class="view-header">
              <div>
                <h2>Download Giochi</h2>
                <p class="lede">Ricerca giochi su HubcapDB</p>
              </div>
            </div>

            <div class="settings-section" style="border-color:var(--signal);">
              <h3 style="color:var(--signal);">🔑 API key HubcapDB richiesta</h3>
              <div class="desc">
                Per usare Download ti serve la tua API key HubcapDB.<br>
                Puoi ottenerla gratuitamente registrandoti su
                <a href="#" id="dl-open-hubcap" style="color:var(--accent);text-decoration:underline;">hubcapmanifest.com</a>.<br><br>
                Una volta ottenuta, inseriscila in <b>Impostazioni → 🔑 La tua API key HubcapDB</b>.
              </div>
              <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
                <button class="btn" id="dl-open-site" type="button">🌐 Apri hubcapmanifest.com</button>
                <button class="btn ghost" id="dl-goto-settings" type="button">⚙ Vai a Impostazioni</button>
              </div>
            </div>
          `;
        }

        return `
          <div class="view-header">
            <div>
              <h2>Download Giochi</h2>
              <p class="lede">Cerca un gioco o inserisci direttamente l'app_id</p>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:18px;max-width:680px;">
            <input class="search-input" id="dl-q" type="text" placeholder="Nome gioco o app_id (es. 3764200)" style="width:auto;flex:1;border-radius:8px;" />
            <button class="btn" id="dl-go" type="button">Cerca</button>
          </div>
          <div id="dl-status" style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;min-height:20px;font-family:var(--font-mono);"></div>
          <div id="dl-results"></div>
        `;
      },
      afterRender: () => {
        const openSite = document.getElementById("dl-open-site");
        const gotoBtn = document.getElementById("dl-goto-settings");
        if (openSite) openSite.addEventListener("click", () => window.api.dialog.openExternal("https://hubcapmanifest.com/api-keys/stats"));
        if (gotoBtn) gotoBtn.addEventListener("click", () => setView("settings"));

        const input = document.getElementById("dl-q");
        const btn = document.getElementById("dl-go");
        const status = document.getElementById("dl-status");
        const results = document.getElementById("dl-results");

        if (!input) return;

        const setStatus = (txt, color = "var(--text-dim)") => {
          status.style.color = color;
          status.textContent = txt;
        };

        let liveTimer = null;
        let searchCache = {};
        const CACHE_TTL_MS = 10 * 60 * 1000;

        const doSearch = async () => {
          const v = input.value.trim();
          if (!v) { setStatus("Inserisci qualcosa."); return; }
          results.innerHTML = "";
          setStatus("⏳ Ricerca...");

          try {
            if (/^\d+$/.test(v)) {
              setStatus(`⏳ Recupero info per app_id ${v}...`);
              let name = null, header = null;
              try {
                const details = await window.api.steam.appDetails([v]);
                const d = details[v];
                if (d && d.name) { name = d.name; header = d.header_image; }
              } catch {}
              const fakeResults = [{
                game_id: v,
                game_name: name || `app_id ${v}`,
                header_image: header || `https://cdn.cloudflare.steamstatic.com/steam/apps/${v}/header.jpg`,
                uploaded_date: "—",
                manifest_available: true
              }];
              setStatus(`Risultato per app_id ${v}`);
              await renderSearchResults(results, fakeResults);
              return;
            }

            // cache locale (10 min)
            const cachedKey = v.toLowerCase();
            const cached = searchCache[cachedKey];
            if (cached && (Date.now() - cached.t) < CACHE_TTL_MS) {
              setStatus(`${cached.data.returned_count} risultati`);
              renderSearchResults(results, cached.data.results);
              return;
            }

            const r = await window.api.hubcap.search({ q: v, limit: 100 });
            if (!r.results || !r.results.length) { setStatus("Nessun risultato."); return; }

            searchCache[cachedKey] = { t: Date.now(), data: r };
            setStatus(`${r.returned_count} risultati (su ${r.total_matches} totali)`);
            await renderSearchResults(results, r.results);
          } catch (e) {
            const msg = e.message || "";
            if (msg.includes("401") || msg.includes("API key")) {
              setStatus("❌ API key non valida o mancante. Controllala in Impostazioni.", "#ff7a7a");
            } else {
              setStatus(`❌ ${msg}`, "#ff7a7a");
            }
          }
        };

        // ricerca live: debounce 350ms, min 3 caratteri
        // esponi doSearch globalmente per poterlo richiamare
        window.__dlDoSearch = doSearch;        
        input.addEventListener("input", () => {
          clearTimeout(liveTimer);
          const v = input.value.trim();
          if (v.length < 3) return;
          liveTimer = setTimeout(doSearch, 350);
        });

        input.addEventListener("keydown", e => {
          if (e.key === "Enter") {
            clearTimeout(liveTimer);
            doSearch();
          }
        });

        btn.addEventListener("click", () => {
          clearTimeout(liveTimer);
          doSearch();
        });
                // esponi doSearch per poterlo richiamare dopo l'aggiornamento
        window.__dlDoSearch = doSearch;
      }
    },
    // ---------------- ONLINEFIX ----------------
    onlinefix: {
      render: async () => `
        <div class="view-header">
          <div>
            <h2>OnlineFix</h2>
            <p class="lede">Fix disponibili nel branch online-fix del repository</p>
          </div>
          <div style="display:flex;gap:8px;">
            <input class="search-input" id="of-q" type="text" placeholder="Cerca un fix…" />
            <button class="btn ghost" id="of-refresh" type="button">⟳ Aggiorna</button>
          </div>
        </div>
        <div id="of-status" style="color:var(--text-dim);font-size:12.5px;margin-bottom:14px;min-height:20px;font-family:var(--font-mono);"></div>
        <div id="of-list"></div>
      `,
      afterRender: () => {
        const q = document.getElementById("of-q");
        const refresh = document.getElementById("of-refresh");
        const status = document.getElementById("of-status");
        const list = document.getElementById("of-list");

        let files = [];

        const setStatus = (txt, color = "var(--text-dim)") => {
          status.style.color = color;
          status.textContent = txt;
        };

        const renderList = () => {
          const filter = q.value.trim().toLowerCase();
          const filtered = filter ? files.filter(f => f.name.toLowerCase().includes(filter)) : files;

          if (!filtered.length) {
            list.innerHTML = `<div class="empty">Nessun OnlineFix trovato.</div>`;
            return;
          }

          list.innerHTML = `
            <div class="row-list">
              ${filtered.map(f => `
                <div class="row-item">
                  <div class="row-icon" style="${coverStyle(f.name)}">
                    ${escapeHtml(f.name[0]?.toUpperCase() || '?')}
                  </div>
                  <div class="row-main">
                    <h4>${escapeHtml(f.name)}</h4>
                    <div class="row-meta"><span>${fmtSize(f.size)}</span></div>
                  </div>
                  <button class="btn small of-dl" data-name="${escapeHtml(f.name)}" type="button">Scarica</button>
                </div>
              `).join('')}
            </div>
          `;

          list.querySelectorAll(".of-dl").forEach(b => {
            b.addEventListener("click", () => downloadOnlineFix(b.dataset.name));
          });
        };

        const load = async () => {
          setStatus("⏳ Carico lista OnlineFix...");
          list.innerHTML = "";
          try {
            const arr = await window.api.github.listFiles("online-fix", {});
            files = arr;
            setStatus(`${files.length} file`);
            renderList();
          } catch (e) {
            setStatus(`❌ ${e.message}`, "#ff7a7a");
          }
        };

        q.addEventListener("input", renderList);
        refresh.addEventListener("click", load);
        load();
      }
    },

    // ---------------- UPLOAD ----------------
    upload: {
      render: async () => {
        // Verifica sempre sul server: se revocato, cancella il token locale
        const chk = await window.api.upload.checkToken();
        const cfg = await window.api.store.all();
        const hasToken = !!(chk.valid && cfg.userToken && cfg.userToken.trim());

        if (!hasToken) {
          return `
            <div class="view-header">
              <div>
                <h2>Upload OnlineFix</h2>
                <p class="lede">Aggiungi un nuovo pacchetto al repository</p>
              </div>
            </div>
            <div class="settings-section" style="border-color:var(--signal);">
              <h3 style="color:var(--signal);">⚠ Token richiesto</h3>
              <div class="desc">
                Per caricare OnlineFix ti serve un token. Contatta l'amministratore, poi inseriscilo in
                <b>Impostazioni → 🔑 Accesso caricamento</b>.
              </div>
            </div>
          `;
        }

        return `
          <div class="view-header">
            <div>
              <h2>Upload OnlineFix</h2>
              <p class="lede">Carica un file .zip, .rar o .7z nel branch online-fix</p>
            </div>
          </div>

          <div class="dropzone" id="up-pick">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 15V4"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            <div><strong>Trascina un file qui</strong> oppure clicca per selezionarlo</div>
            <div id="up-file" style="margin-top:10px;font-family:var(--font-mono);font-size:11.5px;color:var(--text-faint);"></div>
          </div>

          <div style="display:flex;gap:8px;">
            <button class="btn" id="up-go" type="button" disabled>⬆ Carica</button>
          </div>

          <div id="up-status" style="color:var(--text-dim);font-size:12.5px;margin-top:14px;min-height:20px;font-family:var(--font-mono);"></div>
        `;
      },
      afterRender: async () => {
        const pick = document.getElementById("up-pick");
        const go = document.getElementById("up-go");
        const status = document.getElementById("up-status");
        const fileLabel = document.getElementById("up-file");

        if (!pick || !go) return;

        let selectedPath = null;

        const setStatus = (txt, color = "var(--text-dim)") => {
          if (status) { status.style.color = color; status.textContent = txt; }
        };

        const chooseFile = async () => {
          const p = await window.api.dialog.openFile();
          if (!p) return;
          selectedPath = p;
          fileLabel.textContent = p;
          go.disabled = false;
          setStatus("");
        };

        pick.addEventListener("click", chooseFile);

        go.addEventListener("click", async () => {
          if (!selectedPath) { setStatus("Seleziona prima un file.", "#ff7a7a"); return; }
          go.disabled = true;
          pick.style.pointerEvents = "none";
          setStatus("⏳ Carico sul repository...");

          try {
            const r = await window.api.upload.onlinefix(selectedPath);
            setStatus(`✅ Caricato: ${r.file} (${(r.size / 1024).toFixed(1)} KB)${r.overwritten ? " — sovrascritto" : ""}`, "var(--success)");
            toast(`Caricato: ${r.file}`, "ok");
            selectedPath = null;
            fileLabel.textContent = "";
          } catch (e) {
            setStatus(`❌ ${e.message}`, "#ff7a7a");
            toast(e.message);
            if (e.message && (e.message.includes("401") || e.message.toLowerCase().includes("revocato") || e.message.toLowerCase().includes("non valido"))) {
              await window.api.store.set("userToken", "");
              setTimeout(() => setView("upload"), 2000);
            }
          } finally {
            go.disabled = false;
            pick.style.pointerEvents = "";
          }
        });
      }
    },

    // ---------------- IMPOSTAZIONI ----------------
    settings: {
      render: async () => {
        const cfg = await window.api.store.all();
        const isAdmin = await window.api.admin.isLogged();
        return `
          <div class="view-header">
            <div>
              <h2>Impostazioni</h2>
              <p class="lede">Configurazione connessione e accessi</p>
            </div>
          </div>

          <div class="settings-section">
            <h3>🔑 La tua API key HubcapDB</h3>
            <div class="desc">
              Serve per usare la vista <b>Download</b>. Ottienila gratuitamente su
              <a href="#" id="hubcap-open-site" style="color:var(--accent);text-decoration:underline;">hubcapmanifest.com</a>.
              Scade ogni 7 giorni.
            </div>
            <div style="display:flex;gap:8px;max-width:520px;flex-wrap:wrap;">
              <input class="search-input" id="user-hubcap-key" type="password" placeholder="smm_..."
                value="${escapeHtml(cfg.userHubcapApiKey || '')}"
                style="flex:1;min-width:260px;border-radius:8px;" />
              <button class="btn ghost" id="user-hubcap-key-test" type="button">Testa</button>
            </div>
            <p id="user-hubcap-key-status" style="margin-top:10px;color:var(--text-dim);font-size:12.5px;"></p>
          </div>

          ${isAdmin ? `
            <div class="settings-section">
              <h3>Worker URL</h3>
              <div class="desc">URL del proxy Cloudflare (backend). Normalmente non va cambiato.</div>
              <input class="search-input" id="s-workerUrl" type="text"
                value="${escapeHtml(cfg.workerUrl || '')}"
                style="width:100%;max-width:520px;border-radius:8px;" />
            </div>

            <div class="settings-section">
              <h3>Repo GitHub</h3>
              <div class="desc">Repository owner/name dove sono salvati giochi e fix.</div>
              <input class="search-input" id="s-githubRepo" type="text"
                value="${escapeHtml(cfg.githubRepo || '')}"
                style="width:100%;max-width:520px;border-radius:8px;" />
              <div style="margin-top:12px;">
                <button class="btn" id="save-settings" type="button">Salva</button>
                <span id="save-status" style="margin-left:12px;color:var(--text-dim);font-size:12.5px;"></span>
              </div>
            </div>
          ` : ''}

          <div class="settings-section">
            <h3>🔑 Accesso caricamento</h3>
            <div class="desc">Per caricare OnlineFix ti serve un token. Contatta l'amministratore, poi incollalo qui.</div>
            <div style="display:flex;gap:8px;max-width:520px;">
              <input class="search-input" id="user-token" type="password" placeholder="Token (u_...)"
                value="${escapeHtml(cfg.userToken || '')}"
                style="flex:1;border-radius:8px;" />
              <button class="btn ghost" id="user-token-clear" type="button" title="Rimuovi token">🗑</button>
            </div>
            <p id="user-token-status" style="margin-top:10px;color:var(--text-dim);font-size:12.5px;"></p>
          </div>
          <div class="settings-section">
            <h3>🔄 Aggiornamenti</h3>
            <div class="desc">Controlla manualmente se ci sono nuove versioni di SteamFix Manager.</div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <button class="btn" id="check-updates-btn" type="button">Controlla aggiornamenti</button>
              <span id="check-updates-status" style="color:var(--text-dim);font-size:12.5px;font-family:var(--font-mono);"></span>
            </div>
          </div>
          <div class="settings-section">
            <h3>🔐 Accesso amministratore</h3>
            ${isAdmin ? await renderAdminPanel() : `
              <div class="desc">Inserisci il token admin per sbloccare il pannello di gestione.</div>
              <div style="display:flex;gap:8px;max-width:520px;">
                <input class="search-input" id="admin-token" type="password" placeholder="Admin token"
                  style="flex:1;border-radius:8px;" />
                <button class="btn" id="admin-login" type="button">Login</button>
              </div>
              <p id="admin-login-status" style="margin-top:10px;color:var(--text-dim);font-size:12.5px;"></p>
            `}
          </div>
        `;
      },
      afterRender: async () => {
        const btn = document.getElementById("save-settings");
        const status = document.getElementById("save-status");
        if (btn) {
          btn.addEventListener("click", async () => {
            await window.api.store.set("workerUrl", document.getElementById("s-workerUrl").value.trim());
            await window.api.store.set("githubRepo", document.getElementById("s-githubRepo").value.trim());
            status.textContent = "✅ Salvato.";
            setTimeout(() => { status.textContent = ""; }, 2500);
          });
        }

              // --- API key HubcapDB ---
      // --- API key HubcapDB (salvataggio automatico) ---
      const hubcapOpenBtn = document.getElementById('hubcap-open-site');
      if (hubcapOpenBtn) {
        hubcapOpenBtn.addEventListener('click', () => window.api.dialog.openExternal('https://hubcapmanifest.com/api-keys/stats'));
      }

      const hubcapInput = document.getElementById('user-hubcap-key');
      if (hubcapInput) {
        const st = document.getElementById('user-hubcap-key-status');
        let saveTimer = null;
        hubcapInput.addEventListener('input', () => {
          clearTimeout(saveTimer);
          st.style.color = 'var(--text-dim)';
          st.textContent = '⏳ Salvataggio...';
          saveTimer = setTimeout(async () => {
            const v = hubcapInput.value.trim();
            await window.api.hubcapKey.save(v);
            st.style.color = 'var(--success)';
            st.textContent = v ? '✅ Salvato automaticamente.' : '✅ Key rimossa.';
            setTimeout(() => { st.textContent = ''; st.style.color = ''; }, 2000);
          }, 500);
        });
      }

      const hubcapTestBtn = document.getElementById('user-hubcap-key-test');
      if (hubcapTestBtn) {
        const st = document.getElementById('user-hubcap-key-status');
        hubcapTestBtn.addEventListener('click', async () => {
          const v = document.getElementById('user-hubcap-key').value.trim();
          if (!v) { st.style.color = '#ff7a7a'; st.textContent = 'Inserisci una key.'; return; }
          st.style.color = 'var(--text-dim)';
          st.textContent = '⏳ Verifico...';
          try {
            const r = await window.api.hubcapKey.test(v);
            st.style.color = 'var(--success)';
            st.textContent = `✅ Key valida. ${r.username ? 'Account: ' + r.username : ''}`;
          } catch (e) {
            st.style.color = '#ff7a7a';
            st.textContent = `❌ ${e.message}`;
          }
        });
      }

        const userTokInput = document.getElementById("user-token");
        if (userTokInput) {
          const st = document.getElementById("user-token-status");
          // All'apertura Impostazioni: se il token locale è stato revocato, lo cancella
          (async () => {
            const local = userTokInput.value.trim();
            if (!local) return;
            st.style.color = "var(--text-dim)";
            st.textContent = "⏳ Verifico token...";
            const chk = await window.api.upload.checkToken();
            if (!chk.valid && !chk.kept_local) {
              userTokInput.value = "";
              st.style.color = "#ff7a7a";
              st.textContent = "❌ Token revocato/eliminato. Non puoi più caricare.";
            } else if (chk.valid) {
              st.style.color = "var(--success)";
              st.textContent = chk.name ? `✅ Token valido (${chk.name})` : "✅ Token valido";
              setTimeout(() => { st.textContent = ""; st.style.color = ""; }, 2500);
            } else {
              st.textContent = "";
            }
          })();

          let saveTimer = null;
          userTokInput.addEventListener("input", () => {
            clearTimeout(saveTimer);
            st.style.color = "var(--text-dim)";
            st.textContent = "⏳ Salvataggio...";
            saveTimer = setTimeout(async () => {
              const v = userTokInput.value.trim();
              await window.api.store.set("userToken", v);
              if (!v) {
                st.style.color = "var(--success)";
                st.textContent = "✅ Token rimosso.";
                setTimeout(() => { st.textContent = ""; st.style.color = ""; }, 2000);
                return;
              }
              // Verifica subito sul server dopo il salvataggio
              const chk = await window.api.upload.checkToken();
              if (!chk.valid && !chk.kept_local) {
                userTokInput.value = "";
                st.style.color = "#ff7a7a";
                st.textContent = "❌ Token non valido o già revocato.";
              } else if (chk.valid) {
                st.style.color = "var(--success)";
                st.textContent = "✅ Salvato e valido.";
                setTimeout(() => { st.textContent = ""; st.style.color = ""; }, 2000);
              } else {
                st.style.color = "var(--success)";
                st.textContent = "✅ Salvato (verifica rete non disponibile).";
                setTimeout(() => { st.textContent = ""; st.style.color = ""; }, 2000);
              }
            }, 500);
          });
        }
        const userTokClear = document.getElementById("user-token-clear");
        if (userTokClear) {
          const st = document.getElementById("user-token-status");
          userTokClear.addEventListener("click", async () => {
            const ok = await showConfirm({
              title: "Rimuovere il token?",
              message: "Il token di caricamento verrà rimosso da questo dispositivo.",
              confirmText: "Rimuovi",
              danger: true
            });
            if (!ok) return;
            await window.api.store.set("userToken", "");
            document.getElementById("user-token").value = "";
            st.style.color = "var(--success)";
            st.textContent = "✅ Token rimosso.";
            setTimeout(() => { st.textContent = ""; st.style.color = ""; }, 2500);
          });
        }

        const loginBtn = document.getElementById("admin-login");
        if (loginBtn) {
          const st = document.getElementById("admin-login-status");
          loginBtn.addEventListener("click", async () => {
            const t = document.getElementById("admin-token").value.trim();
            if (!t) { st.textContent = "Inserisci il token."; return; }
            st.textContent = "⏳ Verifica...";
            try {
              await window.api.admin.login(t);
              st.textContent = "✅ Login ok. Ricarico...";
              setTimeout(() => setView("settings"), 500);
            } catch (e) {
              st.style.color = "#ff7a7a";
              st.textContent = `❌ ${e.message}`;
            }
          });
        }

        // --- pulsante controllo aggiornamenti ---
        const updBtn = document.getElementById("check-updates-btn");
        if (updBtn) {
          const st = document.getElementById("check-updates-status");
          updBtn.addEventListener("click", async () => {
            st.textContent = "⏳ Controllo...";
            st.style.color = "var(--text-dim)";
            try {
              const info = await window.api.updater.check();
              if (info.updateAvailable) {
                st.textContent = `⬇ Nuova versione: v${info.latest}`;
                st.style.color = "var(--success)";
                await window.__checkForUpdates();
              } else {
                st.textContent = `✅ All'ultima versione (v${info.current || "?"})`;
                st.style.color = "var(--success)";
              }
            } catch (e) {
              st.textContent = `❌ ${e.message}`;
              st.style.color = "#ff7a7a";
            }
          });
        }

        if (document.getElementById("admin-panel")) {
          await bindAdminPanel();
        }
      }
    }
  };

  // ============================================================
  //  ADMIN PANEL
  // ============================================================
  async function renderAdminPanel() {
    let status = null;
    try { status = await window.api.admin.status(); } catch {}

    return `
      <div id="admin-panel" style="margin-top:10px;padding:18px;border-radius:12px;background:var(--bg-surface);border:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="color:var(--success);font-weight:600;">✅ Loggato come admin</div>
          <button class="btn ghost small" id="admin-logout" type="button">Logout</button>
        </div>

        <div style="margin-bottom:20px;font-size:12.5px;color:var(--text-dim);font-family:var(--font-mono);">
          <div>Admin token: <b style="color:var(--text);">${status?.admin_token_configured ? 'configurato' : 'no'}</b></div>
        </div>

        <h4 style="font-size:13px;color:var(--text);margin:22px 0 8px;">⚡ Forza update gioco</h4>
        <div style="display:flex;gap:8px;">
          <input class="search-input" id="admin-force-id" type="text" placeholder="app_id (es. 3764200)"
            style="flex:1;max-width:340px;border-radius:8px;" />
          <button class="btn small" id="admin-force-go" type="button">Forza</button>
        </div>
        <p id="admin-force-status" style="margin-top:10px;color:var(--text-dim);font-size:12.5px;"></p>

        <hr style="margin:22px 0;border:none;border-top:1px solid var(--border);" />

        <h4 style="font-size:13px;color:var(--text);margin-bottom:8px;">🎫 Token Utente</h4>
        <p style="color:var(--text-dim);font-size:12px;margin-bottom:10px;">Genera un token per chi vuoi autorizzare a caricare OnlineFix.</p>
        <div style="display:flex;gap:8px;max-width:520px;margin-bottom:12px;">
          <input class="search-input" id="admin-token-name" type="text" placeholder="Nome (es. Marco)"
            style="flex:1;border-radius:8px;" />
          <button class="btn small" id="admin-create-token" type="button">Genera</button>
        </div>
        <p id="admin-token-status" style="margin-bottom:12px;color:var(--text-dim);font-size:12.5px;"></p>

        <div id="admin-token-list" style="font-size:12.5px;"></div>
      </div>
    `;
  }

  async function bindAdminPanel() {
    document.getElementById("admin-logout").addEventListener("click", async () => {
      await window.api.admin.logout();
      setView("settings");
    });


    const forceStatus = document.getElementById("admin-force-status");
    document.getElementById("admin-force-go").addEventListener("click", async () => {
      const id = document.getElementById("admin-force-id").value.trim();
      if (!id) { forceStatus.textContent = "Inserisci app_id."; return; }
      forceStatus.style.color = "var(--text-dim)";
      forceStatus.textContent = "⏳ Forzo update...";
      try {
        const r = await window.api.admin.forceUpdate(id);
        forceStatus.style.color = r.action === "error" ? "#ff7a7a" : "var(--success)";
        forceStatus.innerHTML = `✅ ${escapeHtml(r.message || r.action)} <span style="color:var(--text-dim);">(manifest: ${r.file?.manifest_count ?? '?'})</span>`;
      } catch (e) {
        forceStatus.style.color = "#ff7a7a";
        forceStatus.textContent = `❌ ${e.message}`;
      }
    });

    // --- Token utente ---
    const tokenStatus = document.getElementById("admin-token-status");
    const tokenList = document.getElementById("admin-token-list");

    const refreshTokens = async () => {
      if (!tokenList) return;
      tokenList.innerHTML = '<span style="color:var(--text-dim);">Caricamento...</span>';
      console.log("[refreshTokens] inizio chiamata listTokens");
      try {
        const r = await window.api.admin.listTokens();
        console.log("[refreshTokens] risposta:", r);
        const toks = r.tokens || [];
        if (!toks.length) {
          tokenList.innerHTML = '<span style="color:var(--text-dim);">Nessun token generato.</span>';
          return;
        }

        tokenList.innerHTML = "";
        const table = document.createElement("table");
        table.style.cssText = "width:100%;border-collapse:collapse;color:var(--text);";
        table.innerHTML = `
          <thead>
            <tr style="text-align:left;border-bottom:1px solid var(--border);">
              <th style="padding:6px 4px;">Nome</th>
              <th style="padding:6px 4px;">Token</th>
              <th style="padding:6px 4px;">Stato</th>
              <th style="padding:6px 4px;width:240px;">Azioni</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
        const tbody = table.querySelector("tbody");

        for (const t of toks) {
          const tr = document.createElement("tr");
          tr.style.cssText = "border-bottom:1px solid var(--border-soft);";

          const tdName = document.createElement("td");
          tdName.style.padding = "6px 4px";
          tdName.textContent = t.name || "";

          const tdToken = document.createElement("td");
          tdToken.style.cssText = "padding:6px 4px;font-family:var(--font-mono);font-size:11.5px;";
          tdToken.textContent = t.token_masked || "";

          const tdState = document.createElement("td");
          tdState.style.padding = "6px 4px";
          tdState.style.color = t.active ? "var(--success)" : "#ff7a7a";
          tdState.textContent = t.active ? "attivo" : "revocato";

          const tdActions = document.createElement("td");
          tdActions.style.cssText = "padding:6px 4px;text-align:right;white-space:nowrap;";

          if (t.active) {
            const bReveal = document.createElement("button");
            bReveal.className = "btn ghost small";
            bReveal.style.marginRight = "4px";
            bReveal.textContent = "Mostra";
            bReveal.addEventListener("click", async () => {
              try {
                const rr = await window.api.admin.revealToken(t.token_id);
                tokenStatus.style.color = "var(--success)";
                tokenStatus.textContent = `Token: ${rr.token_full}`;
                try { await navigator.clipboard.writeText(rr.token_full); tokenStatus.textContent += " (copiato)"; } catch {}
              } catch (e) {
                tokenStatus.style.color = "#ff7a7a";
                tokenStatus.textContent = `❌ ${e.message}`;
              }
            });
            tdActions.appendChild(bReveal);

            const bRevoke = document.createElement("button");
            bRevoke.className = "btn small";
            bRevoke.style.cssText = "background:#c62828;margin-right:4px;";
            bRevoke.textContent = "Revoca";
            bRevoke.addEventListener("click", async () => {
              const ok = await showConfirm({
                title: "Revocare il token?",
                message: "Il token non sarà più utilizzabile per caricare OnlineFix.",
                confirmText: "Revoca",
                danger: true
              });
              if (!ok) return;
              try {
                await window.api.admin.revokeToken(t.token_id);
                // Se questo PC aveva quel token salvato, lo toglie subito
                await window.api.upload.checkToken();
                tokenStatus.style.color = "var(--success)";
                tokenStatus.textContent = "✅ Token eliminato. Quella persona non può più caricare.";
                await refreshTokens();
              } catch (e) {
                tokenStatus.style.color = "#ff7a7a";
                tokenStatus.textContent = `❌ ${e.message}`;
              }
            });
            tdActions.appendChild(bRevoke);
          }

          const bRemove = document.createElement("button");
          bRemove.className = "btn small";
          bRemove.style.cssText = "background:var(--signal);";
          bRemove.textContent = "Rimuovi";
          bRemove.addEventListener("click", async () => {
            const ok = await showConfirm({
              title: "Rimuovere il token?",
              message: "Il token verrà cancellato definitivamente. Operazione irreversibile.",
              confirmText: "Rimuovi",
              danger: true
            });
            if (!ok) return;
            try {
              await window.api.admin.removeToken(t.token_id);
              await window.api.upload.checkToken();
              tokenStatus.style.color = "var(--success)";
              tokenStatus.textContent = "✅ Token eliminato. Quella persona non può più caricare.";
              await refreshTokens();
            } catch (e) {
              tokenStatus.style.color = "#ff7a7a";
              tokenStatus.textContent = `❌ ${e.message}`;
            }
          });
          tdActions.appendChild(bRemove);

          tr.appendChild(tdName);
          tr.appendChild(tdToken);
          tr.appendChild(tdState);
          tr.appendChild(tdActions);
          tbody.appendChild(tr);
        }

        tokenList.appendChild(table);
        console.log("[refreshTokens] tabella renderizzata con", toks.length, "token");
      } catch (e) {
        console.error("[refreshTokens] errore:", e);
        tokenList.innerHTML = `<span style="color:#ff7a7a;">Errore: ${escapeHtml(e.message)}</span>`;
      }
    };
       const createBtn = document.getElementById("admin-create-token");
    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        const name = document.getElementById("admin-token-name").value.trim();
        if (!name) { tokenStatus.textContent = "Inserisci un nome."; return; }
        tokenStatus.style.color = "var(--text-dim)";
        tokenStatus.textContent = "⏳ Genero...";
        try {
          const r = await window.api.admin.createToken(name);
          console.log("[createToken] risposta:", r);
          tokenStatus.style.color = "var(--success)";
          tokenStatus.innerHTML = `✅ Creato per <b>${escapeHtml(r.name)}</b>: <code style="font-family:var(--font-mono);">${escapeHtml(r.token_full)}</code>`;
          try { await navigator.clipboard.writeText(r.token_full); tokenStatus.innerHTML += " (copiato)"; } catch {}
          document.getElementById("admin-token-name").value = "";

          // Mostra subito Mostra/Revoca (senza attendere ritardi KV)
          await refreshTokens();
          // Retry breve se la lista non ha ancora il nuovo token
          const hasNew = () => {
            const html = tokenList ? tokenList.innerHTML : "";
            return !!(html.includes(r.token_masked || "") || html.includes(escapeHtml(r.name || "")));
          };
          if (!hasNew()) {
            for (const ms of [400, 900, 1600]) {
              await new Promise((res) => setTimeout(res, ms));
              await refreshTokens();
              if (hasNew()) break;
            }
          }
        } catch (e) {
          tokenStatus.style.color = "#ff7a7a";
          tokenStatus.textContent = `❌ ${e.message}`;
        }
      });
    }

    refreshTokens();
  }

  // ============================================================
  //  HELPERS (download, search render)
  // ============================================================
  async function renderSearchResults(container, list) {
      // 1) prendi gli app_id dalla lista
  const appIds = list.map(g => g.game_id).filter(id => /^\d+$/.test(id));

  // 2) chiedi al worker quali sono su R2
  let r2Map = {};
  try {
    if (appIds.length > 0) {
      const r2 = await window.api.hubcap.r2CheckBatch(appIds);
      r2Map = r2.results || {};
    }
  } catch (e) {
    console.warn('r2CheckBatch fallita:', e);
  }
    container.innerHTML = `
      <div class="row-list">
        ${list.map(g => `
          <div class="row-item">
            <div class="row-icon" style="${coverStyle(g.game_name || g.game_id)};${g.header_image ? `background-image:url('${escapeHtml(g.header_image)}');background-size:cover;` : ''}">
              ${g.header_image ? '' : escapeHtml((g.game_name || "?")[0])}
            </div>
            <div class="row-main">
              <h4>${escapeHtml(g.game_name)}</h4>
              <div class="row-meta">
                <span>app_id: ${escapeHtml(g.game_id)}</span>
                <span>${(() => {
                  const r2 = r2Map[g.game_id];
                  return r2 && r2.exists
                    ? `R2: ${fmtDate(r2.uploaded)}`
                    : `HubcapDB: ${escapeHtml(g.uploaded_date || "—")}`;
                })()}</span>
              </div>
            </div>
            ${(() => {
              const r2 = r2Map[g.game_id];
              const exists = r2 && r2.exists;
              const uploaded = exists ? r2.uploaded : null;
              const dateLabel = uploaded ? fmtDate(uploaded) : '—';
              if (exists) {
                return `
                  <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <div style="font-size:11px;color:var(--success);font-family:var(--font-mono);text-align:right;">
                      ✅ Caricato ${dateLabel}
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn small dl-update-btn" data-id="${escapeHtml(g.game_id)}" data-mode="update" type="button" title="Riscarica da HubcapDB">🔄 Riscarica</button>
                      <button class="btn small dl-install-btn" data-id="${escapeHtml(g.game_id)}" type="button">📥 Installa</button>
                      <button class="btn small ghost dl-save-btn" data-id="${escapeHtml(g.game_id)}" type="button">💾 .zip</button>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
                    <div style="font-size:11px;color:var(--signal);font-family:var(--font-mono);text-align:right;">
                      🆕 Non ancora nel database
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn small dl-update-btn" data-id="${escapeHtml(g.game_id)}" data-mode="add" type="button" title="Aggiungi al database">⬆ Aggiungi</button>
                    </div>
                  </div>
                `;
              }
            })()}
          </div>
        `).join('')}
      </div>
    `;

    // --- pulsante ⬆ Aggiorna (conferma + seconda modale download) ---
    container.querySelectorAll(".dl-update-btn").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.dataset.id;
        const isAdd = b.dataset.mode === "add";

        const ok = await showConfirm({
          title: isAdd ? "Aggiungere questo gioco?" : "Aggiornare questo gioco?",
          message:
            "Questa operazione scaricherà da HubcapDB i file manifest e lua più recenti, " +
            (isAdd
              ? "e li aggiungerà al database GitHub.\n\n"
              : "e li caricherà nel database GitHub.\n\n") +
            "⚠ Consuma 2 richieste della tua quota giornaliera HubcapDB.\n\n" +
            "Continuare?",
          confirmText: isAdd ? "⬆ Aggiungi" : "⬆ Aggiorna",
          cancelText: "Annulla"
        });
        if (!ok) return;

        b.disabled = true;
        b.textContent = "⏳...";

        try {
          const r = await window.api.github.syncGame(id);
          toast(formatSyncMessage(r), r.action === "created" || r.action === "updated" ? "ok" : "info");

          if (typeof window.__refreshQuota === "function") window.__refreshQuota();
          

          if (r.action === "created" || r.action === "updated" || r.action === "noop") {
            // dopo l'aggiornamento, chiedi se installare anche in SteamTools
            const installNow = await showConfirm({
              title: isAdd ? "Aggiunta completata" : "Aggiornamento completato",
              message:
                `Vuoi anche installare i file aggiornati direttamente in SteamTools?\n\n` +
                `(Verrà chiesto il permesso di amministratore)`,
              confirmText: "📥 Installa ora",
              cancelText: "No, dopo"
            });

            if (installNow) {
              b.textContent = "📥...";
              try {
                const res = await window.api.steam.installFromWorker(id);
                toast(`Installati: ${res.luaCopied} .lua, ${res.manifestsCopied} .manifest`, "ok");

                const restart = await showConfirm({
                  title: "Installazione completata",
                  message: "Vuoi riavviare Steam adesso?",
                  confirmText: "🔄 Riavvia Steam",
                  cancelText: "Più tardi"
                });
                if (restart) {
                  await window.api.steam.restartSteam();
                  toast("Steam riavviato", "ok");
                }
              } catch (e) {
                toast(e.message);
              }
            }
          }
        } catch (e) {
          toast(e.message);
        } finally {
          b.disabled = false;
          b.textContent = isAdd ? "⬆ Aggiungi" : "🔄 Riscarica";

          // dopo l'aggiornamento, ricarica la ricerca per aggiornare la card
          const input = document.getElementById("dl-q");
          const resultsContainer = document.getElementById("dl-results");
          if (input && resultsContainer && input.value.trim()) {
            // ri-trigger della ricerca
            const evt = new KeyboardEvent("keydown", { key: "Enter" });
            input.dispatchEvent(evt);
          }
        }
      });
    });

    // --- pulsante Installa (scarica + estrae in SteamTools con UAC) ---
    container.querySelectorAll(".dl-install-btn").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.dataset.id;

        const ok = await showConfirm({
          title: "Installare in SteamTools?",
          message:
            `L'app scaricherà i file manifest e lua per il gioco ${id} ` +
            `e li copierà direttamente in SteamTools.\n\n` +
            `⚠ Verrà chiesto il permesso di amministratore (UAC).\n\n` +
            `Continuare?`,
          confirmText: "📥 Installa"
        });
        if (!ok) return;

        b.disabled = true;
        b.textContent = "⏳...";

        try {
          // prima assicura che il file esista su GitHub
          const r = await window.api.github.syncGame(id);
          if (r.action === "unavailable" || r.action === "error") {
            throw new Error(formatSyncMessage(r));
          }
          if (r.action === "created") {
            await new Promise(res => setTimeout(res, 4000));
          }

          // installa in SteamTools
          const res = await window.api.steam.installFromWorker(id);
          toast(`Installati: ${res.luaCopied} .lua, ${res.manifestsCopied} .manifest`, "ok");

          // chiedi se vuole riavviare Steam
          const restart = await showConfirm({
            title: "Installazione completata",
            message: "Vuoi riavviare Steam adesso per applicare le modifiche?",
            confirmText: "🔄 Riavvia Steam",
            cancelText: "Più tardi"
          });
          if (restart) {
            const r2 = await window.api.steam.restartSteam();
            if (r2.ok) toast("Steam riavviato", "ok");
            else toast("Errore riavvio Steam: " + (r2.error || ""));
          }
        } catch (e) {
          toast(e.message);
        } finally {
          b.disabled = false;
          b.textContent = "📥 Installa";
        }
      });
    });

    // --- pulsante Salva .zip (comportamento attuale) ---
    container.querySelectorAll(".dl-save-btn").forEach(b => {
      b.addEventListener("click", () => downloadGame(b.dataset.id));
    });
  }
  function formatSyncMessage(r) {
    switch (r.action) {
      case "created":     return `✅ Aggiunto: ${r.file?.path} (${r.file?.manifest_count ?? "?"} manifest)`;
      case "updated":     return `✅ Aggiornato: ${r.file?.path}`;
      case "noop":        return `ℹ️ Già presente: ${r.file?.path || r.app_id + ".zip"}`;
      case "unavailable": return `⚠️ Non disponibile su HubcapDB.`;
      case "error":       return `❌ Errore: ${r.message || r.step || "sconosciuto"}`;
      default:            return `ℹ️ ${r.action || "ok"}`;
    }
  }

  async function downloadGame(appId) {
    const status = document.getElementById("dl-status");
    const setStatus = (txt, color = "var(--text-dim)") => {
      if (status) { status.style.color = color; status.textContent = txt; }
    };

    try {
      setStatus("⏳ Verifico il file su GitHub...");
      const r = await window.api.github.syncGame(appId);
      if (r.action === "unavailable" || r.action === "error") {
        setStatus(formatSyncMessage(r), "#ff7a7a"); return;
      }
      if (r.action === "created") {
        setStatus("⏳ File appena creato, attendo propagazione GitHub...");
        await new Promise(res => setTimeout(res, 4000));
      }

      const fileName = `${appId}.zip`;
      const destPath = await window.api.dialog.saveFile(fileName);
      if (!destPath) { setStatus(""); return; }

      setStatus("⏳ Download in corso...");
      const res = await window.api.github.download({ branch: "games", remotePath: fileName, destPath });
      setStatus(`✅ Salvato: ${res.destPath} (${fmtSize(res.size)})`, "var(--success)");
      toast("Download completato", "ok");
    } catch (e) {
      setStatus(`❌ ${e.message}`, "#ff7a7a");
      toast(e.message);
    }
  }

  async function downloadOnlineFix(fileName) {
    const status = document.getElementById("of-status");
    const setStatus = (txt, color = "var(--text-dim)") => {
      if (status) { status.style.color = color; status.textContent = txt; }
    };

    try {
      const destPath = await window.api.dialog.saveFile(fileName);
      if (!destPath) return;
      setStatus("⏳ Download in corso...");
      const res = await window.api.github.download({ branch: "online-fix", remotePath: fileName, destPath });
      setStatus(`✅ Salvato: ${res.destPath} (${fmtSize(res.size)})`, "var(--success)");
      toast("Download completato", "ok");
    } catch (e) {
      setStatus(`❌ ${e.message}`, "#ff7a7a");
      toast(e.message);
    }
  }
  async function downloadOnlineFix(fileName) {
    const status = document.getElementById("of-status");
    const setStatus = (txt, color = "var(--text-dim)") => {
      if (status) { status.style.color = color; status.textContent = txt; }
    };

    try {
      const destPath = await window.api.dialog.saveFile(fileName);
      if (!destPath) return;
      setStatus("⏳ Download in corso...");
      const res = await window.api.github.download({ branch: "online-fix", remotePath: fileName, destPath });
      setStatus(`✅ Salvato: ${res.destPath} (${fmtSize(res.size)})`, "var(--success)");
      toast("Download completato", "ok");
    } catch (e) {
      setStatus(`❌ ${e.message}`, "#ff7a7a");
      toast(e.message);
    }
  }

  function fmtDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'adesso';
    if (mins < 60) return `${mins} min fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  } catch { return '—'; }
}

  
  // ============================================================
  //  AUTO-UPDATE
  // ============================================================
  async function checkForUpdates(silent = true) {
    try {
      const info = await window.api.updater.check();
      if (!info || !info.updateAvailable) {
        if (!silent) toast("✅ Sei all'ultima versione.", "ok");
        return;
      }
      // nessun rimanda: il pop-up appare ogni volta che l'app viene aperta
      // se c'è una nuova versione. L'utente può chiudere e riaprire l'app
      // → il pop-up ricompare.
      const ok = await showConfirm({
        title: `⬇ Aggiornamento disponibile: v${info.latest}`,
        message:
          `Versione attuale: v${info.current}\n` +
          `Nuova versione: v${info.latest}\n\n` +
          (info.notes ? `Cosa c'è di nuovo:\n${info.notes.slice(0, 400)}${info.notes.length > 400 ? '...' : ''}\n\n` : '') +
          `Vuoi aggiornare adesso?`,
        confirmText: "⬇ Aggiorna ora",
        cancelText: "Più tardi"
      });

       if (!ok) {
        // l'utente ha cliccato "Più tardi" → non salviamo nulla
        // al prossimo avvio il pop-up ricompare
        toast(`Puoi aggiornare quando vuoi da Impostazioni → 🔄 Aggiornamenti.`, "info");
        return;
      }

      await startUpdate(info);
    } catch (e) {
      console.error("[update]", e);
      if (!silent) toast("Errore controllo aggiornamenti: " + e.message);
    }
  }

  async function startUpdate(info) {
    const overlay = document.createElement("div");
    overlay.id = "update-overlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(11,13,18,.88);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 26px 30px;
      max-width: 460px; width: calc(100% - 60px);
      color: var(--text); text-align: center;
    `;
    modal.innerHTML = `
      <h3 style="font-size:16px;margin-bottom:8px;">⬇ Download aggiornamento v${escapeHtml(info.latest)}</h3>
      <p style="color:var(--text-dim);font-size:13px;margin-bottom:20px;">Scarico la nuova versione...</p>
      <div style="height:6px;background:var(--bg-surface);border-radius:999px;overflow:hidden;">
        <div id="upd-progress" style="height:100%;width:0%;background:var(--accent);transition:width .2s;"></div>
      </div>
      <p id="upd-pct" style="color:var(--text-dim);font-size:12px;margin-top:12px;font-family:var(--font-mono);">0%</p>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    window.api.updater.onProgress((d) => {
      const bar = document.getElementById("upd-progress");
      const pct = document.getElementById("upd-pct");
      if (bar) bar.style.width = d.percent + "%";
      if (pct) pct.textContent = d.percent + "%";
    });

    const r = await window.api.updater.download(info.latest);
    if (!r.ok) { overlay.remove(); toast("Errore download: " + r.error); return; }

    // 1) rimuovi l'overlay della progress bar
    overlay.remove();

    // 2) mostra la conferma (ora visibile sopra l'app, non dietro nessun overlay)
    const doInstall = await showConfirm({
      title: "Download completato",
      message: "L'app verrà chiusa e riaperta automaticamente con la nuova versione.\n\nContinuare?",
      confirmText: "Installa e riavvia",
      cancelText: "Più tardi"
    });
    if (!doInstall) {
      overlay.remove();
      toast("File scaricato. Puoi installare quando vuoi da Impostazioni → 🔄 Aggiornamenti.", "info");
      return;
    }

    await window.api.updater.install(r.path);
  }

  window.__checkForUpdates = () => checkForUpdates(false);


  // ============================================================
  //  ROUTING
  // ============================================================
  async function setView(name) {
    view.classList.add("leaving");
    await new Promise(r => setTimeout(r, 140));
    view.innerHTML = await views[name].render();
    view.classList.remove("leaving");
    view.classList.add("entering");
    requestAnimationFrame(() => requestAnimationFrame(() => view.classList.remove("entering")));
    navButtons.forEach(b => b.classList.toggle("active", b.dataset.view === name));
    moveIndicator(document.querySelector(`.nav-btn[data-view="${name}"]`));
    if (views[name].afterRender) await views[name].afterRender();
  }

  navButtons.forEach(b => {
    b.addEventListener("click", () => setView(b.dataset.view));
  });

  // Fix Steam
  fixSteamBtn.addEventListener("click", async () => {
    if (fixSteamBtn.disabled) return;
    fixSteamBtn.classList.add("running");
    fixSteamBtn.disabled = true;
    fixSteamBtn.querySelector(".fix-label").textContent = "Verifica in corso...";
    try {
      const r = await window.api.steamfix.run();
      fixSteamBtn.classList.remove("running");
      fixSteamBtn.classList.add("done");
      fixSteamBtn.querySelector(".fix-label").textContent = r.ok ? "Fix completato" : "Errore";
      toast(r.ok ? "Steam verificato e corretto" : (r.error || r.err || "Errore"), r.ok ? "ok" : "info");
      setTimeout(() => {
        fixSteamBtn.classList.remove("done");
        fixSteamBtn.disabled = false;
        fixSteamBtn.querySelector(".fix-label").textContent = "Fix Steam";
      }, 1800);
    } catch (e) {
      fixSteamBtn.classList.remove("running");
      fixSteamBtn.disabled = false;
      fixSteamBtn.querySelector(".fix-label").textContent = "Fix Steam";
      toast(e.message);
    }
  });

  // ============================================================
  //  INIT
  // ============================================================
  (async () => {
    try {
      const v = await window.api.version();
      versionEl.textContent = "v" + v;
    } catch {}
    setView("library");
  })();

    // ============================================================
  //  MODALE CONFERMA PERSONALIZZATA
  // ============================================================
  function showConfirm({ title = "Conferma", message = "", confirmText = "OK", cancelText = "Annulla", danger = false } = {}) {
    return new Promise((resolve) => {
      // overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(11,13,18,.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        animation: of-fade-in .18s ease-out;
      `;

      // modale
      const modal = document.createElement("div");
      modal.style.cssText = `
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 24px 26px 20px;
        max-width: 420px; width: calc(100% - 48px);
        box-shadow: 0 24px 60px rgba(0,0,0,.55);
        animation: of-slide-up .22s cubic-bezier(.16,1,.3,1);
        color: var(--text);
      `;

      const titleEl = document.createElement("h3");
      titleEl.textContent = title;
      titleEl.style.cssText = "font-size:16px;font-weight:700;margin-bottom:10px;color:var(--text);";

      const msgEl = document.createElement("p");
      msgEl.textContent = message;
      msgEl.style.cssText = "font-size:13.5px;line-height:1.55;color:var(--text-dim);margin-bottom:22px;white-space:pre-line;";

      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px;";

      const btnCancel = document.createElement("button");
      btnCancel.textContent = cancelText;
      btnCancel.style.cssText = `
        background: transparent; color: var(--text-dim);
        border: 1px solid var(--border); padding: 9px 18px;
        border-radius: var(--radius-pill); font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: background .15s, color .15s;
      `;
      btnCancel.addEventListener("mouseenter", () => { btnCancel.style.background = "var(--bg-surface)"; btnCancel.style.color = "var(--text)"; });
      btnCancel.addEventListener("mouseleave", () => { btnCancel.style.background = "transparent"; btnCancel.style.color = "var(--text-dim)"; });

      const btnConfirm = document.createElement("button");
      btnConfirm.textContent = confirmText;
      btnConfirm.style.cssText = `
        background: ${danger ? "#c62828" : "var(--accent)"}; color: #fff;
        border: none; padding: 9px 18px;
        border-radius: var(--radius-pill); font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: inherit;
        transition: filter .15s;
      `;
      btnConfirm.addEventListener("mouseenter", () => { btnConfirm.style.filter = "brightness(1.15)"; });
      btnConfirm.addEventListener("mouseleave", () => { btnConfirm.style.filter = "none"; });

      const close = (result) => {
        overlay.style.animation = "of-fade-out .15s ease-in forwards";
        modal.style.animation = "of-slide-down .15s ease-in forwards";
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 150);
      };

      btnCancel.addEventListener("click", () => close(false));
      btnConfirm.addEventListener("click", () => close(true));
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") { close(false); document.removeEventListener("keydown", onKey); }
        if (e.key === "Enter") { close(true); document.removeEventListener("keydown", onKey); }
      });

      actions.appendChild(btnCancel);
      actions.appendChild(btnConfirm);
      modal.appendChild(titleEl);
      modal.appendChild(msgEl);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // focus sul bottone di conferma
      setTimeout(() => btnConfirm.focus(), 50);
    });
  }

  // Ogni 60 secondi ricontrolla se la key HubcapDB è ancora valida
setInterval(async () => {
  const cfg = await window.api.store.all();
  const hasKey = !!(cfg.userHubcapApiKey && cfg.userHubcapApiKey.trim());

  // se siamo nella vista Download e la key è cambiata di stato, ricarica
  const currentView = document.querySelector('.nav-btn.active')?.dataset.view;
  if (currentView === 'download') {
    const view = document.getElementById('view');
    const hasBlockedMessage = !!document.getElementById('dl-open-site');
    if (!hasKey && !hasBlockedMessage) {
      // la key è sparita mentre eravamo in Download → ricarica
      setView('download');
    }
    if (hasKey && hasBlockedMessage) {
      // la key è apparsa → ricarica
      setView('download');
    }
  }
}, 60000); // ogni 60 secondi

  // controllo automatico all'avvio (dopo 3 secondi)
  setTimeout(() => {
    checkForUpdates(true).catch(e => console.error("[startup update]", e));
  }, 3000);

})();