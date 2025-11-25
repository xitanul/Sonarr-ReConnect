# Repository Guidelines

## Project Structure & Entry Points
- Popup UI: `popup.html` loads `js/popup-module.js` (ES modules for app, UI, Sonarr API).
- Options page: `options.html` loads `js/options.js`.
- Background: service worker `js/background.js` (type: module) handles alarms + badge fetch; offscreen page removed.
- Shared utilities: `js/settings.js` (sync defaults), `js/storage.js` (local cache + migrate), `js/utils.js`, `js/popup-util.js`; feature modules in `js/modules/`.
- Assets: styles in `css/` (Foundation + `custom.css`), icons at repo root, sample data `series.json` for manual checks.

## Coding Style
- Modern ES modules with `import`/`export`; prefer `const`/`let`, template strings, Fetch API.
- Match surrounding indentation in each file (most modules/popup use 4 spaces; background uses 2).
- Strings: prefer single quotes; use template literals for URLs; end statements with semicolons.
- Keep ES5 compatibility only where required by Chrome MV3 (no bundler); continue to avoid third-party deps unless already present.
- Reuse existing selectors/storage keys (`apiKey`, `url`, `wantedItems`, `showBadge`, etc.); extend `Settings.defaults` and related option fields together.

## Initialization & Runtime Flow
- Background: `background.init()` loads settings, schedules `chrome.alarms` (`fetchData`) with `backgroundInterval`, and on each alarm refreshes Sonarr wanted count then updates the badge text.
- Popup: `app.init()` in `popup-module.js` runs `Storage.migrate()`, loads settings, instantiates UI + SonarrApi, binds menu/events, then loads the active mode (`calendar`/`series`/`history`).
- Options: saving updates storage defaults and resets the `fetchData` alarm interval; Test Connection uses `api/v3/system/status` to validate URL/API key.

## Build, Test, and Development
- No bundler; load unpacked via `chrome://extensions` → Developer Mode → Load unpacked → repo root.
- Quick package: `mkdir -p dist && zip -r dist/sonarr-reconnect.zip . -x "*.git*" "dist*"`.
- After edits, click “Reload” on Extensions page; service worker restarts automatically.

## Testing Guidelines
- Manual: configure Sonarr endpoint (default `http://localhost:8989`), set API key, click “Test Connection,” then open popup to verify Calendar/Wanted/History tabs populate.
- Badge: enable “Show badge,” wait for the alarm interval (default 5 minutes) and confirm badge text matches wanted count; check service worker logs for fetch/alarm issues.
- When changing API calls, keep response shapes aligned with `series.json` and chrome.storage caching intact (local cache via `Storage`, settings via `Settings`).

## Commit & Release
- Commit messages: short, imperative (e.g., “Fix service worker badge”).
- PRs: include purpose/issue link, screenshots for popup/options UI changes, manual test steps, and manifest version bump notes when applicable.
- Release: bump `manifest.json` version and `changelog.txt` together before packaging. Avoid committing real API keys; keep new settings in both `settings.js` defaults and `options.js` form bindings.
