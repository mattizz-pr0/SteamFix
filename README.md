# SteamFix Manager

**SteamFix Manager** è un'applicazione desktop Windows che semplifica la gestione di giochi e fix per SteamTools. Cerca, scarica, aggiorna e installa automaticamente i giochi e gli OnlineFix dal database del progetto.

---

## ✨ Funzionalità

### 📚 Libreria
- Vedi tutti i giochi installati in SteamTools (`Steam\config\stplug-in`)
- Nomi e immagini ufficiali prese direttamente da Steam
- **Aggiorna** un gioco con un click (riscarica i manifest più recenti e li reinstalla)
- **Elimina** un gioco (rimuove `.lua` + `.manifest` collegati)
- **Riavvia Steam** automaticamente

### ⬇ Download
- Cerca giochi per nome su HubcapDB
- Ricerca live mentre digiti (nessun pulsante "Cerca" necessario)
- **Aggiorna** un gioco sul database centrale (una volta fatto, tutti gli utenti ne beneficiano)
- **Scarica** il file `.zip` del gioco direttamente sul tuo PC

### 🔧 OnlineFix
- Sfoglia tutti i fix disponibili caricati dalla community
- Cerca per nome
- Scarica il fix che ti serve

### ⬆ Upload
- Carica i tuoi OnlineFix sul database centrale
- Se hai ricevuto un **token di caricamento**, puoi contribuire al progetto

### 🔧 Fix Steam
- Risolve automaticamente l'errore **"Connection Failed"** di Steam
- Un click → risolve il problema → Steam riparte

### 🔄 Aggiornamenti automatici
- L'app controlla automaticamente se ci sono nuove versioni
- Ti avvisa quando c'è un aggiornamento disponibile
- Si aggiorna da sola, senza dover riscaricare nulla

---

## 🚀 Come si usa

### 1. Installa l'app
Scarica il file `SteamFix Manager Setup x.x.x.exe` e installalo. È un'installazione standard: Avanti → Avanti → Installa.

### 2. Ottieni la tua API key HubcapDB
La funzione **Download** richiede una API key gratuita di [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats).

- Registrati su hubcapmanifest.com
- Vai nella sezione "API Access" → "My Key"
- Copia la tua API key
- Incollala in **SteamFix Manager → Impostazioni → 🔑 La tua API key HubcapDB**

**La key scade ogni 7 giorni.** Quando succede, l'app ti avvisa e ti basta rigenerarla dal sito.

### 3. Inizia a usare l'app
- **Libreria** → vedi e gestisci i giochi che hai già installato
- **Download** → cerca e scarica nuovi giochi
- **OnlineFix** → sfoglia e scarica i fix dalla community
- **Fix Steam** → risolvi l'errore "Connection Failed"

### 4. (Opzionale) Contribuisci
Se vuoi caricare i tuoi OnlineFix per la community, chiedi un **token di caricamento** all'amministratore. Una volta ricevuto, inseriscilo in **Impostazioni → 🔑 Accesso caricamento**.

---

## ⚙️ Requisiti

- **Windows 10/11** (64-bit)
- **SteamTools** installato (o la cartella `Steam\config\stplug-in` esistente)
- Connessione internet

---

## ❓ Domande frequenti

### La ricerca in Download non funziona
Hai inserito la tua API key HubcapDB? Senza, la funzione Download è bloccata. Vai in **Impostazioni → 🔑 La tua API key HubcapDB** e incollala.

### La mia API key è scaduta
Le API key di HubcapDB scadono ogni 7 giorni. Vai su [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats), rigenera la key, e incollala di nuovo nell'app. L'app ti avvisa quando mancano pochi giorni alla scadenza.

### "Aggiungi" vs "Aggiorna"
Il pulsante **⬆ Aggiorna** carica il gioco sul database centrale (una volta, così tutti gli utenti ce l'hanno). Il pulsante **Scarica** scarica il file `.zip` sul tuo PC. Puoi fare entrambe le cose in sequenza.

### Dove vengono salvati i giochi scaricati?
Quando clicchi **Scarica**, si apre una finestra "Salva con nome" — scegli tu dove metterlo. Di default ti propone la cartella Download.

### Ho installato una nuova versione ma le mie impostazioni ci sono ancora?
Sì, è voluto. Le impostazioni (API key, token) sono salvate in una cartella separata (`%APPDATA%\steamfix-manager`) che non viene toccata dagli aggiornamenti.

### Come disinstallo l'app?
**Impostazioni di Windows → App → App installate → SteamFix Manager → Disinstalla**. Non perdi le tue impostazioni (rimangono in `%APPDATA%`).

---

## 🔐 Privacy e sicurezza

- L'app **non raccoglie dati personali**
- La tua **API key HubcapDB** è salvata **solo sul tuo PC** (`%APPDATA%\steamfix-manager\config.json`)
- Le chiamate a HubcapDB sono fatte **direttamente** dal tuo PC, con **la tua** API key
- Il worker Cloudflare usato per gli aggiornamenti **non salva** la tua key

---

## 📄 Licenza

**Proprietary License** — Tutti i diritti riservati.
Copyright (c) 2026 mattizz-pr0.

È severamente vietata la redistribuzione, la modifica o la vendita di questa applicazione senza esplicita autorizzazione scritta.

---

## 📞 Supporto

Per problemi, richieste di token, o segnalazioni:
**contatta l'amministratore** (mattizz-pr0).

---

**Versione attuale:** 1.0.3
**Ultimo aggiornamento:** Ottobre 2026
