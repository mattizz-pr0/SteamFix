# Changelog

All notable changes to **SteamFix Manager** are documented in this file.

## [1.0.5] — 2026-11-06

### Added
- **App language**: choose **Italiano** or **English** in Settings. The choice is saved and applied on restart.
- **MIT License** shown inside the app: the sidebar item is clickable and opens the full license text.

### Changed
- **Simpler update notification**: the popup only shows the current and new version, with a link to read the release notes on the website. It no longer scrolls through the whole changelog.

### Security
- `.lua` and `.manifest` files inside ZIP archives are accepted only when the file name contains letters, numbers, dot, underscore and hyphen exclusively. An archive with suspicious names is rejected (checked both in the app and on the server).
- Electron renderer runs in **sandbox** mode.
- External links can only open `http` / `https` addresses.
- Removed an unused PowerShell script.

## [1.0.4] — 2026-11-06

### Added
- **⬆ Add** button in the Download view for games not yet in the database (previously it wrongly showed "Update")
- **MIT License** shown inside the app: the sidebar item is clickable and opens the full license text
- Bilingual Italian / English README
- `CHANGELOG.md` file

### Fixed
- After an action in the Download view the button goes back to the correct label: **🔄 Re-download** for games already present, **⬆ Add** for new ones

### Changed
- Project license changed from proprietary to **MIT** (`LICENSE`, `package.json`, README)

## [1.0.3] — 2026-10-21

- Maintenance release.

## [1.0.2] — 2026-10-03

### Fixed
- The "Update" button now actually updates
- Force-update works correctly
- Icons with a black square → regenerated `.ico`
- Installer license with accents

### Improved
- Various improvements

## [1.0.1] — 2026-10-02

### Added
- **Install** button in the Download view (copies the files directly into SteamTools)
- Auto-update: the app notifies you when a new version is available
- HubcapDB quota counter in the top right (remaining / reset / key expiry)

### Fixed
- App icon (black square → sharp icon)

## [1.0.0] — 2026-10-01

- First public release.
