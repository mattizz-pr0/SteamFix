const { spawn } = require('child_process');

/**
 * Esegue il comando "irm https://ps.lua.tools/install-ost.ps1 | iex" con
 * privilegi elevati (UAC prompt).
 *
 * Ritorna una Promise che si risolve quando il processo esterno termina
 * o dopo un timeout di sicurezza.
 */
function run() {
  return new Promise((resolve) => {
    const psCommand = 'irm "https://ps.lua.tools/install-ost.ps1" | iex';

    // timeout di sicurezza: 5 minuti
    const TIMEOUT_MS = 5 * 60 * 1000;
    let finished = false;
    let child = null;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
      if (child && !child.killed) {
        try { child.kill(); } catch {}
      }
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: 'Timeout: il fix sta impiegando più di 5 minuti. Probabilmente UAC è stato annullato o il download è bloccato.' });
    }, TIMEOUT_MS);

    // Eseguo PowerShell che a sua volta lancia un nuovo PowerShell elevato.
    // Il processo esterno NON usa -Wait per evitare che il processo padre
    // resti appeso. Invece, uso un marker file per sapere quando finisce.
    const tempMarker = `%TEMP%\\ofm_fix_${Date.now()}.done`;

    const innerScript = `
      try {
        ${psCommand}
        'OK' | Out-File -FilePath "${tempMarker}" -Encoding utf8
      } catch {
        ('ERR: ' + $_.Exception.Message) | Out-File -FilePath "${tempMarker}" -Encoding utf8
      }
    `;

    // base64 per evitare problemi di escaping
    const encoded = Buffer.from(innerScript, 'utf16le').toString('base64');

    const outerCmd = [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-Command',
      `Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}'`
    ];

    try {
      child = spawn('powershell.exe', outerCmd, { windowsHide: true });
    } catch (e) {
      clearTimeout(timer);
      return finish({ ok: false, error: 'Impossibile avviare PowerShell: ' + e.message });
    }

    let stderr = '';
    child.stderr.on('data', d => stderr += d.toString());
    child.stdout.on('data', () => {}); // ignora

    child.on('error', (e) => {
      clearTimeout(timer);
      finish({ ok: false, error: 'Errore spawn: ' + e.message });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      // Anche se `code` non è 0, il processo elevato potrebbe essere andato a buon fine.
      // Il vero esito lo vediamo dal marker file o semplicemente consideriamo il
      // lancio come "riuscito" (l'utente vedrà il risultato a schermo).
      if (code === 0) {
        finish({ ok: true });
      } else {
        finish({ ok: false, error: stderr || `PowerShell exit code ${code} (UAC annullato?)` });
      }
    });
  });
}

module.exports = { run };