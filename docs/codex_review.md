# Code Review (2025-11-25)

## Findings
- **High** – `manifest.json:11-26` lacks `host_permissions`, so background/popup `fetch` calls to Sonarr rely on permissive CORS; browsers will block cross-origin requests for most users, leaving badge and popup data empty.
- **Medium** – `js/popup-module.js:96-100` always sets badge text when calendar loads, ignoring the `showBadge` option; opening the popup can re-enable the badge even when the user disabled it.
- **Medium** – `js/background.js:40-45` forces a red “!” badge on fetch errors regardless of `showBadge`, and never resets the badge background color on recovery, so the badge can stay visible/colored after transient failures or when the badge is disabled.
- **Low** – `js/background.js:6-14` schedules the alarm but never triggers an initial fetch; after install or settings change the badge remains empty until the first interval elapses.
- **Low** – `js/storage.js:2-6` returns `null` for cached empty arrays/objects due to `result[key] || null`; empty caches can’t be preserved, causing unnecessary refetching and making “no results” states indistinguishable from missing cache.

## Questions / Assumptions
- Should the badge always respect `showBadge` (including error states and popup-triggered updates), or should errors override the setting?
- Are broad Sonarr host permissions acceptable (e.g., `http://*/*`, `https://*/*`), or should permissions be limited to a user-specified base URL prompt?

## Testing
- Not run (review only).
