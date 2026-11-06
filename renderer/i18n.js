// ============================================================
//  i18n — Italiano / English
//  Uso:
//    L("testo italiano", "english text")  -> stringa nella lingua attiva
//    data-it / data-en / data-it-ph / data-en-ph  -> testi statici in index.html
// ============================================================

(function () {
  let lang = "it";

  // ---------- traduzione errori dal backend/worker ----------
  // Sostituzioni applicate ai messaggi di errore (italiano -> inglese).
  // L'ordine conta: le frasi più lunghe vanno prima.
  const ERR_MAP = [
    ["API key HubcapDB mancante. Inseriscila in Impostazioni.", "HubcapDB API key missing. Add it in Settings."],
    ["Token utente non impostato. Vai in Impostazioni → Accesso caricamento.", "Upload token not set. Go to Settings → Upload access."],
    ["Token utente non valido o revocato", "User token invalid or revoked"],
    ["Admin token non impostato. Effettua il login.", "Admin token not set. Please log in."],
    ["Token admin non valido.", "Invalid admin token."],
    ["Impossibile verificare il token (rete)", "Unable to verify the token (network)"],
    ["Installazione fallita (UAC negato?)", "Installation failed (UAC denied?)"],
    ["Rimozione fallita", "Removal failed"],
    ["File non trovato", "File not found"],
    ["File troppo grande", "File too large"],
    ["File vuoto", "Empty file"],
    ["API key vuota.", "API key is empty."],
    ["Key non valida", "Invalid key"],
    ["Query minima 3 caratteri", "Query must be at least 3 characters"],
    ["Estensione non ammessa", "File type not allowed"],
    ["Header X-Filename mancante", "Missing X-Filename header"],
    ["Token non trovato", "Token not found"],
    ["Token utente non valido", "Invalid user token"],
    ["token_id mancante", "Missing token_id"],
    ["Nome mancante", "Missing name"],
    ["app_id obbligatorio", "app_id is required"],
    ["app_id deve essere numerico", "app_id must be numeric"],
    ["branch obbligatorio", "branch is required"],
    ["Parametri branch e path obbligatori", "branch and path are required"],
    ["version obbligatorio", "version is required"],
    ["parametro ids obbligatorio", "ids parameter is required"],
    ["Massimo 200 ids per richiesta", "Maximum 200 ids per request"],
    ["Massimo 100 app_ids per richiesta", "Maximum 100 app_ids per request"],
    ["Massimo 100 file per richiesta", "Maximum 100 files per request"],
    ["API key non valida o mancante. Controllala in Impostazioni.", "Invalid or missing API key. Check it in Settings."],
    ["Steam.exe non trovato nei percorsi standard", "Steam.exe not found in the standard paths"],
    ["Nessuna key da testare", "No key to test"],
    ["KV non configurato", "KV not configured"],
    ["ADMIN_TOKEN non configurato sul worker", "ADMIN_TOKEN not configured on the worker"],
    ["RELEASES_REPO non configurato", "RELEASES_REPO not configured"],
    ["Body JSON non valido", "Invalid JSON body"],
    ["Errore", "Error"],
    ["errore", "error"],
    ["sconosciuto", "unknown"]
  ];

  function translateError(message) {
    if (lang !== "en" || !message) return message;
    let out = String(message);
    for (const [it, en] of ERR_MAP) {
      if (out.includes(it)) out = out.split(it).join(en);
    }
    return out;
  }

  function L(it, en) {
    return lang === "en" ? en : it;
  }

  function applyStatic() {
    document.documentElement.lang = lang === "en" ? "en" : "it";
    document.querySelectorAll("[data-it]").forEach((el) => {
      const value = el.getAttribute("data-" + lang);
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll("[data-it-ph]").forEach((el) => {
      const value = el.getAttribute("data-" + lang + "-ph");
      if (value != null) el.setAttribute("placeholder", value);
    });
    document.querySelectorAll("[data-it-title]").forEach((el) => {
      const value = el.getAttribute("data-" + lang + "-title");
      if (value != null) el.setAttribute("title", value);
    });
  }

  async function init() {
    try {
      const cfg = await window.api.store.all();
      lang = cfg && cfg.lang === "en" ? "en" : "it";
    } catch {
      lang = "it";
    }
    applyStatic();
    return lang;
  }

  async function setLang(next) {
    lang = next === "en" ? "en" : "it";
    try {
      await window.api.store.set("lang", lang);
    } catch {}
    applyStatic();
  }

  window.i18n = {
    init,
    setLang,
    L,
    applyStatic,
    translateError,
    get lang() { return lang; }
  };
})();
