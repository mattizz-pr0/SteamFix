# SteamFix Manager

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-31-47848F">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-3DA639">
</p>

<p align="center">
  <strong>🇬🇧 English</strong> · <a href="README.it.md">🇮🇹 Italiano</a>
</p>

**SteamFix Manager** is a Windows desktop application that simplifies managing games and fixes for SteamTools. It searches, downloads, updates and installs games and OnlineFix content automatically from the project database.

Built with **vibe coding**: an AI-assisted workflow where features are described in natural language, implemented, and reviewed step by step.

## ✨ Features

### 📚 Library
- See every game installed in SteamTools (`Steam\config\stplug-in`)
- Official names and artwork pulled directly from Steam
- **Update** a game with one click (re-downloads the latest manifests and reinstalls them)
- **Remove** a game (deletes the related `.lua` + `.manifest` files)
- **Restart Steam** automatically

### ⬇ Download
- Search games by name on HubcapDB
- Live search while you type (no "Search" button needed)
- **Update** a game in the central database (do it once, everyone benefits)
- **Download** the game's `.zip` file straight to your PC

### 🔧 OnlineFix
- Browse every fix uploaded by the community
- Search by name
- Download the fix you need

### ⬆ Upload
- Upload your OnlineFix content to the central database
- If you received an **upload token**, you can contribute to the project

### 🔧 Fix Steam
- Automatically fixes Steam's **"Connection Failed"** error
- One click → problem solved → Steam restarts

### 🔄 Automatic updates
- The app checks for new versions automatically
- Notifies you when an update is available
- Updates itself, no re-download needed

### 🌍 Language
- Italian and English interface
- Switch language anytime from **Settings → 🌍 Language**

## 🚀 Getting started

### 1. Install the app
Download `SteamFix Manager Setup x.x.x.exe` and install it. It's a standard installation: Next → Next → Install.

### 2. Get your HubcapDB API key
The **Download** feature requires a free API key from [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats).

- Sign up on hubcapmanifest.com
- Go to "API Access" → "My Key"
- Copy your API key
- Paste it into **SteamFix Manager → Settings → 🔑 Your HubcapDB API key**

**The key expires every 7 days.** When that happens the app warns you — just regenerate it on the site.

### 3. Start using the app
- **Library** → view and manage the games you already have installed
- **Download** → search and download new games
- **OnlineFix** → browse and download fixes from the community
- **Fix Steam** → fix the "Connection Failed" error

### 4. (Optional) Contribute
If you want to upload your OnlineFix content for the community, ask the administrator for an **upload token**. Once you have it, enter it in **Settings → 🔑 Upload access**.

## ⚙️ Requirements

- **Windows 10/11** (64-bit)
- **SteamTools** installed (or the `Steam\config\stplug-in` folder present)
- Internet connection

## ❓ FAQ

### Download search doesn't work
Did you enter your HubcapDB API key? Without it the Download feature is locked. Go to **Settings → 🔑 Your HubcapDB API key** and paste it.

### My API key expired
HubcapDB API keys expire every 7 days. Go to [hubcapmanifest.com](https://hubcapmanifest.com/api-keys/stats), regenerate the key and paste it into the app again. The app warns you when the key is about to expire.

### "Add" vs "Update"
The **⬆ Update** button uploads the game to the central database (once, so every user has it). The **Download** button downloads the `.zip` file to your PC. You can do both, one after the other.

### Where are downloaded games saved?
When you click **Download**, a "Save as" dialog opens — you choose the location. It defaults to your Downloads folder.

### I installed a new version but my settings are still there?
Yes, that's intended. Settings (API key, token) are stored in a separate folder (`%APPDATA%\steamfix-manager`) that updates don't touch.

### How do I uninstall the app?
**Windows Settings → Apps → Installed apps → SteamFix Manager → Uninstall**. You don't lose your settings (they stay in `%APPDATA%`).

## 🔐 Privacy and security

- The app **does not collect personal data**
- Your **HubcapDB API key** is stored **only on your PC** (`%APPDATA%\steamfix-manager\config.json`)
- HubcapDB calls are made **directly** from your PC, with **your** API key
- The Cloudflare worker used for updates **does not store** your key

## 🛠 Built with vibe coding

This project was built with **vibe coding**: an AI-assisted development approach where ideas turn into working code through fast iteration across prompts, tests and fixes.

## 📄 License

**MIT License** — Copyright (c) 2026 mattizz-pr0.

The software is provided "as is", without warranty of any kind. You are free to use, copy, modify, distribute, sublicense and sell the software, provided the copyright notice and this permission notice are included in all copies or substantial portions. See the [LICENSE](LICENSE) file.

## 📞 Support

For issues, token requests or bug reports:
**contact the administrator** (mattizz-pr0).

---

**Current version:** 1.0.5
**Last updated:** November 2026

**Changelog:** [CHANGELOG.md](CHANGELOG.md)
