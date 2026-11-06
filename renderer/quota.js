// ============================================================
//  Counter quota HubcapDB in alto a destra (tutte le viste)
// ============================================================

(function () {
  const L = (it, en) => window.i18n.L(it, en);
  let quota = null;
  let lastFetch = 0;
  const REFRESH_MS = 30 * 1000; // refresh ogni 30 secondi

  function createWidget() {
    let el = document.getElementById('quota-widget');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'quota-widget';
    el.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(18, 21, 28, .85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-dim);
      cursor: pointer;
      transition: all .2s;
      user-select: none;
    `;
    el.title = L("Clicca per aggiornare · La quota si azzera ogni giorno","Click to refresh · The quota resets every day");
    el.innerHTML = `
      <span style="font-size:13px;">📊</span>
      <span id="quota-text">…</span>
    `;

    el.addEventListener('click', () => fetchQuota(true));
    document.body.appendChild(el);
    return el;
  }

  function setText(text, color) {
    const el = document.getElementById('quota-text');
    if (!el) return;
    el.textContent = text;
    const widget = document.getElementById('quota-widget');
    if (widget) {
      widget.style.borderColor = color;
      widget.style.color = color;
    }
  }

  async function fetchQuota(force = false) {
    const now = Date.now();
    if (!force && (now - lastFetch) < REFRESH_MS && quota) {
      render();
      return;
    }

    try {
      const key = await window.api.hubcapKey.get();
      if (!key) {
        quota = null;
        setText(L('⚠ Nessuna key','⚠ No key'), 'var(--text-dim)');
        return;
      }

      const r = await window.api.hubcap.userStats();
      if (!r || r.error) {
        quota = null;
        setText(L('⚠ Quota non disponibile','⚠ Quota unavailable'), 'var(--signal)');
        return;
      }

      quota = r;
      lastFetch = now;
      render();
    } catch (e) {
      quota = null;
      setText(L('⚠ Errore quota','⚠ Quota error'), '#ff7a7a');
    }
  }

  function render() {
    if (!quota) return;

    const used = quota.daily_usage ?? 0;
    const limit = quota.daily_limit ?? 25;
    const remaining = Math.max(0, limit - used);

    // colore in base alle rimaste
    let color = 'var(--success)';       // verde
    if (remaining <= 5) color = 'var(--signal)';   // arancio
    if (remaining <= 2) color = '#ff7a7a';         // rosso

    // countdown al reset (mezzanotte)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msToReset = midnight - now;
    const h = Math.floor(msToReset / 3600000);
    const m = Math.floor((msToReset % 3600000) / 60000);

    // countdown scadenza key
    let expiryText = '';
    if (quota.api_key_expires_at) {
      const exp = new Date(quota.api_key_expires_at);
      const msToExp = exp - now;
      if (msToExp > 0) {
        const days = Math.floor(msToExp / 86400000);
        const hours = Math.floor((msToExp % 86400000) / 3600000);
        if (days > 0) expiryText = ` · key: ${days}${L('g','d')}`;
        else if (hours > 0) expiryText = ` · key: ${hours}h`;
        else expiryText = ` · key: <1h`;
      } else {
        expiryText = L(' · key SCADUTA',' · key EXPIRED');
        color = '#ff7a7a';
      }
    }

    setText(`${remaining}/${limit} ${L('rimaste','left')} · reset ${h}h ${m}m${expiryText}`, color);
  }

  // Init: crea il widget quando la pagina è pronta
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createWidget();
      fetchQuota();
      setInterval(() => fetchQuota(), REFRESH_MS);
    });
  } else {
    createWidget();
    fetchQuota();
    setInterval(() => fetchQuota(), REFRESH_MS);
  }
})();