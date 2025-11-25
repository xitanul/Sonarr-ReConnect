# Repository Guidelines

## Project Structure & Module Organization
- Entry points: `popup.html`, `options.html`, `offscreen.html`; service worker in `js/background.js` declared by `manifest.json`.
- JavaScript: `js/` holds UI logic (`popup.js`), options handling (`options.js`), utilities (`popup-util.js`), vendors (`js/vendor/jquery.js`, `moment-with-locales.js`).
- Styles: `css/` (Foundation + `custom.css`). Icons sit at repo root; `series.json` is sample Sonarr data for manual checks.

## Build, Test, and Development Commands
- No bundler: files run directly under Chrome Manifest V3.
- Load unpacked: `chrome://extensions` → Developer Mode → Load unpacked → repo root.
- Quick packaging: `mkdir -p dist && zip -r dist/sonarr-reconnect.zip . -x "*.git*" "dist*"`.
- After edits, hit “Reload” on the Extensions page; the service worker/offscreen doc restarts automatically.

## Coding Style & Naming Conventions
- ES5-style for MV3: use `var`/function declarations, avoid ESM imports.
- 2-space indent, single quotes, trailing semicolons to mirror current code.
- Reuse selectors/storage keys already in place (`apiKey`, `url`, `wantedItems`); extend `sonarr.settings` instead of hardcoding URLs.

## Testing Guidelines
- Manual: configure Sonarr endpoint (default `http://localhost:8989`), set API key, click “Test Connection,” then open the popup to confirm Calendar/Wanted/History populate.
- Badge: enable “Show badge,” wait for the background interval (default 5 minutes), and confirm text updates; inspect `chrome://extensions` → Service Worker logs for alarms/fetch issues.
- When changing API calls, match response shapes to `series.json` and keep localStorage caching intact.

## Commit & Pull Request Guidelines
- Use short, imperative subjects (e.g., “Fix service worker badge”).
- PRs should list purpose/issue link, screenshots of popup/options when UI changes, manual test steps, and manifest version bumps if applicable.
- Run a quick regression of popup tabs and options save/test; record the result in the PR text.

## Release & Configuration Tips
- Bump `manifest.json` and `changelog.txt` together before packaging.
- Do not commit real API keys; Chrome `storage.sync` keeps them local. Add new settings with defaults in both `background.js` and `options.js`.
