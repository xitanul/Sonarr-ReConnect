# Sonarr ReConnect — Code Review (2025-12-14)

Scope: Chrome MV3 extension codebase at repo root (`popup.html`, `options.html`, `js/*`).

## High Priority

1. **Service worker lifetime / badge reliability**
   - `fetchData()` is called but not awaited inside the alarm + storage listeners, so the MV3 service worker can go idle mid-fetch and badge updates can be flaky.
   - Locations:
     - `js/background.js:17-22` (`chrome.alarms.onAlarm` → `this.fetchData()`)
     - `js/background.js:25-30` (`chrome.storage.onChanged` → `this.fetchData()`)

2. **First-run UX: “Test connection” likely fails before permission is granted**
   - Options “Test connection” fetches `api/v3/system/status` without first ensuring the optional host permission exists for the configured Sonarr origin. In MV3 this often fails until after “Save” requests the permission.
   - Location: `js/options.js:25-53`

3. **URL parsing robustness**
   - Multiple unguarded `new URL(...)` calls are applied to user-provided settings; invalid values can throw and break the flow.
   - Locations:
     - `js/background.js:39`
     - `js/popup-module.js:25`
     - `js/options.js:122`

## Security / Privacy

1. **Avoid `innerHTML` when a safe alternative is easy**
   - `series.status` is interpolated into `innerHTML` for `#show-status`. It’s probably low-risk in practice (Sonarr-controlled), but it’s unnecessary and easy to replace with DOM building + `textContent`.
   - Location: `js/modules/ui.js:220`

2. **API key exposure via image URLs**
   - Posters/fanart use `apikey=` query params (necessary for `<img>`), but it increases the chance of leaking keys via server logs/history.
   - Location: `js/popup-util.js:73-87`
   - Suggestion: keep querystring usage strictly limited to image loads and avoid logging those URLs.

3. **Storage location for API key**
   - API key is stored in `chrome.storage.sync` (convenient, but synced); if you want to minimize exposure, consider storing the key in `chrome.storage.local` while leaving non-sensitive prefs in sync.
   - Location: `js/settings.js:14-22` and usage across options/popup/background.

## Maintainability / UX

1. **Duplicate DOM IDs inside templates**
   - `popup.html` templates include repeated `id` attributes (`#poster`, `#status`, etc.). Once multiple clones are appended, the document has duplicate IDs which can cause selector confusion and is invalid HTML.
   - Location: `popup.html` (`template-series`, `template-show`)
   - Suggestion: replace with classes or `data-*` attributes and only use `id` for singletons.

2. **Cache not scoped to server identity**
   - Local cache keys are only mode names (`calendar`, `series`, `history`). If the user changes Sonarr URL/API key, cached data from a prior server can flash in the UI until fresh fetch completes.
   - Locations:
     - `js/storage.js` (simple `chrome.storage.local` wrapper)
     - `js/popup-module.js:118-127` (renders cached then refreshes)
   - Suggestion: namespace cache by `{origin}` or clear cache on `url/apiKey` changes.

3. **Unused/dead code**
   - Unused import: `formatDate` is imported but never used.
     - `js/popup-module.js:5`
   - Unused function: `formatDate` is never referenced.
     - `js/popup-util.js:60-64`
   - Unused import: `normalizeBaseUrl` is imported in `UI` but not used.
     - `js/modules/ui.js:1`

4. **Badge update duplication**
   - Badge updates happen in both popup and background; you can end up with inconsistent state if one path succeeds and the other fails.
   - Locations:
     - `js/background.js` (`updateBadge`, `fetchData`)
     - `js/popup-module.js:140-144` (sets badge when loading calendar)
   - Suggestion: centralize badge logic in the background worker; have popup only trigger refresh.

## Suggested Next Patch (if desired)

1. Await background fetches (and/or use `event.waitUntil` patterns where applicable) to improve MV3 reliability.
2. Request host permission before “Test connection” (or provide a clear message that permission is required and a one-click grant flow).
3. Add URL validation/normalization and fail gracefully before calling `new URL`.
4. Replace `innerHTML` in `ui.js` with safe DOM operations.
5. Remove unused imports/functions and/or add linting checks (if you want lightweight tooling).

