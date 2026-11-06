# SteamFix Manager

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-31-47848F">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-3DA639">
</p>

<p align="center">
  <a href="#-italiano">🇮🇹 Italiano</a> · <a href="#-english">🇬🇧 English</a>
</p>

---

## 🇮🇹 Italiano

**SteamFix Manager** è un'applicazione desktop Windows che semplifica la gestione di giochi e fix per SteamTools. Cerca, scarica, aggiorna e installa automaticamente i giochi e gli OnlineFix dal database del progetto.

### ✨ Funzionalità

#### 📚 Libreria
- Vedi tutti i giochi installati in SteamTools (`Steam\config\stplug-in`)
- Nomi e immagini ufficiali prese direttamente da Steam
- **Aggiorna** un gioco con un click (riscarica i manifest più recenti e li reinstalla)
- **Elimina** un gioco (rimuove `.lua` + `.manifest` collegati)
- **Riavvia Steam** automaticamente

#### ⬇ Download
- Cerca giochi per nome su HubcapDB
- Ricerca live mentre digiti (nessun pulsante "Cerca" necessario)
- **Aggiorna** un gioco sul database centrale (una volta fatto, tutti gli utenti ne beneficiano)
- **Scarica** il file `.zip` del gioco direttamente sul tuo PC

#### 🔧 OnlineFix
- Sfoglia tutti i fix disponibili caricati dalla community
- Cerca per nome
- Scarica il fix che ti serve

#### ⬆ Upload
- Carica i tuoi OnlineFix sul database centrale
- Se hai ricevuto un **token di caricamento**, puoi contribuire al progetto

#### 🔧 Fix Steam
- Risolve automaticamente l'errore **"Connection Failed"** di Steam
- Un click → risolve il problema → Steam riparte

#### 🔄 Aggiornamenti automatici
- L'app controlla automaticamente se ci sono nuove versioni
- Ti avvisa quando c'è un aggiornamento disponibile
- Si aggiorna da sola, senza dover riscaricare nulla

### 🚀 Come si usa

#### 1. Installa l'app
Scarica il file `SteamFix Manager Setup x.x.x.exe` e installalo. È un'installazione standard: Avanti → Avanti → Installa.

#### 2. Ottieni la tua API key HubcapDB
La funzione **Download** richiede una API key gratuita di [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats).

- Registrati su hubcapmanifest.com
- Vai nella sezione "API Access" → "My Key"
- Copia la tua API key
- Incollala in **SteamFix Manager → Impostazioni → 🔑 La tua API key HubcapDB**

**La key scade ogni 7 giorni.** Quando succede, l'app ti avvisa e ti basta rigenerarla dal sito.

#### 3. Inizia a usare l'app
- **Libreria** → vedi e gestisci i giochi che hai già installato
- **Download** → cerca e scarica nuovi giochi
- **OnlineFix** → sfoglia e scarica i fix dalla community
- **Fix Steam** → risolvi l'errore "Connection Failed"

#### 4. (Opzionale) Contribuisci
Se vuoi caricare i tuoi OnlineFix per la community, chiedi un **token di caricamento** all'amministratore. Una volta ricevuto, inseriscilo in **Impostazioni → 🔑 Accesso caricamento**.

### ⚙️ Requisiti

- **Windows 10/11** (64-bit)
- **SteamTools** installato (o la cartella `Steam\config\stplug-in` esistente)
- Connessione internet

### ❓ Domande frequenti

#### La ricerca in Download non funziona
Hai inserito la tua API key HubcapDB? Senza, la funzione Download è bloccata. Vai in **Impostazioni → 🔑 La tua API key HubcapDB** e incollala.

#### La mia API key è scaduta
Le API key di HubcapDB scadono ogni 7 giorni. Vai su [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats), rigenera la key, e incollala di nuovo nell'app. L'app ti avvisa quando mancano pochi giorni alla scadenza.

#### "Aggiungi" vs "Aggiorna"
Il pulsante **⬆ Aggiorna** carica il gioco sul database centrale (una volta, così tutti gli utenti ce l'hanno). Il pulsante **Scarica** scarica il file `.zip` sul tuo PC. Puoi fare entrambe le cose in sequenza.

#### Dove vengono salvati i giochi scaricati?
Quando clicchi **Scarica**, si apre una finestra "Salva con nome" — scegli tu dove metterlo. Di default ti propone la cartella Download.

#### Ho installato una nuova versione ma le mie impostazioni ci sono ancora?
Sì, è voluto. Le impostazioni (API key, token) sono salvate in una cartella separata (`%APPDATA%\steamfix-manager`) che non viene toccata dagli aggiornamenti.

#### Come disinstallo l'app?
**Impostazioni di Windows → App → App installate → SteamFix Manager → Disinstalla**. Non perdi le tue impostazioni (rimangono in `%APPDATA%`).

### 🔐 Privacy e sicurezza

- L'app **non raccoglie dati personali**
- La tua **API key HubcapDB** è salvata **solo sul tuo PC** (`%APPDATA%\steamfix-manager\config.json`)
- Le chiamate a HubcapDB sono fatte **direttamente** dal tuo PC, con **la tua** API key
- Il worker Cloudflare usato per gli aggiornamenti **non salva** la tua key

### 🛠 Realizzata con il vibe coding

Questo progetto è stato sviluppato con il **vibe coding**: uno sviluppo guidato dall'AI, in cui le idee diventano codice iterando rapidamente tra prompt, test e correzioni.

### 📄 Licenza

**MIT License** — Copyright (c) 2026 mattizz-pr0.

Il software è fornito così com'è, senza garanzie di alcun tipo. È consentito usare, copiare, modificare, distribuire, sublicenziare e vendere il software, a condizione di includere il copyright e il testo della licenza in tutte le copie o parti sostanziali. Vedi il file [LICENSE](LICENSE).

### 📞 Supporto

Per problemi, richieste di token, o segnalazioni:
**contatta l'amministratore** (mattizz-pr0).

**Versione attuale:** 1.0.4
**Ultimo aggiornamento:** Novembre 2026

---

## 🇬🇧 English

**SteamFix Manager** is a Windows desktop application that simplifies managing games and fixes for SteamTools. It searches, downloads, updates and installs games and OnlineFix content automatically from the project database.

### ✨ Features

#### 📚 Library
- See every game installed in SteamTools (`Steam\config\stplug-in`)
- Official names and artwork pulled directly from Steam
- **Update** a game with one click (re-downloads the latest manifests and reinstalls them)
- **Remove** a game (deletes the related `.lua` + `.manifest` files)
- **Restart Steam** automatically

#### ⬇ Download
- Search games by name on HubcapDB
- Live search while you type (no "Search" button needed)
- **Update** a game in the central database (do it once, everyone benefits)
- **Download** the game's `.zip` file straight to your PC

#### 🔧 OnlineFix
- Browse every fix uploaded by the community
- Search by name
- Download the fix you need

#### ⬆ Upload
- Upload your OnlineFix content to the central database
- If you received an **upload token**, you can contribute to the project

#### 🔧 Fix Steam
- Automatically fixes Steam's **"Connection Failed"** error
- One click → problem solved → Steam restarts

#### 🔄 Automatic updates
- The app checks for new versions automatically
- Notifies you when an update is available
- Updates itself, no re-download needed

### 🚀 Getting started

#### 1. Install the app
Download `SteamFix Manager Setup x.x.x.exe` and install it. It's a standard installation: Next → Next → Install.

#### 2. Get your HubcapDB API key
The **Download** feature requires a free API key from [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats).

- Sign up on hubcapmanifest.com
- Go to "API Access" → "My Key"
- Copy your API key
- Paste it into **SteamFix Manager → Settings → 🔑 Your HubcapDB API key**

**The key expires every 7 days.** When that happens the app warns you — just regenerate it on the site.

#### 3. Start using the app
- **Library** → view and manage the games you already have installed
- **Download** → search and download new games
- **OnlineFix** → browse and download fixes from the community
- **Fix Steam** → fix the "Connection Failed" error

#### 4. (Optional) Contribute
If you want to upload your OnlineFix content for the community, ask the administrator for an **upload token**. Once you have it, enter it in **Settings → 🔑 Upload access**.

### ⚙️ Requirements

- **Windows 10/11** (64-bit)
- **SteamTools** installed (or the `Steam\config\stplug-in` folder present)
- Internet connection

### ❓ FAQ

#### Download search doesn't work
Did you enter your HubcapDB API key? Without it the Download feature is locked. Go to **Settings → 🔑 Your HubcapDB API key** and paste it.

#### My API key expired
HubcapDB API keys expire every 7 days. Go to [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats), regenerate the key and paste it into the app again. The app warns you when the key is about to expire.

#### "Add" vs "Update"
The **⬆ Update** button uploads the game to the central database (once, so every user has it). The **Download** button downloads the `.zip` file to your PC. You can do both, one after the other.

#### Where are downloaded games saved?
When you click **Download**, a "Save as" dialog opens — you choose the location. It defaults to your Downloads folder.

#### I installed a new version but my settings are still there?
Yes, that's intended. Settings (API key, token) are stored in a separate folder (`%APPDATA%\steamfix-manager`) that updates don't touch.

#### How do I uninstall the app?
**Windows Settings → Apps → Installed apps → SteamFix Manager → Uninstall**. You don't lose your settings (they stay in `%APPDATA%`).

### 🔐 Privacy and security

- The app **does not collect personal data**
- Your **HubcapDB API key** is stored **only on your PC** (`%APPDATA%\steamfix-manager\config.json`)
- HubcapDB calls are made **directly** from your PC, with **your** API key
- The Cloudflare worker used for updates **does not store** your key

### 🛠 Built with vibe coding

This project was built with **vibe coding**: an AI-assisted development approach where ideas turn into working code through fast iteration across prompts, tests and fixes.

### 📄 License

**MIT License** — Copyright (c) 2026 mattizz-pr0.

The software is provided "as is", without warranty of any kind. You are free to use, copy, modify, distribute, sublicense and sell the software, provided the copyright notice and this permission notice are included in all copies or substantial portions. See the [LICENSE](LICENSE) file.

### 📞 Support

For issues, token requests or bug reports:
**contact the administrator** (mattizz-pr0).

**Current version:** 1.0.4
**Last updated:** November 2026
