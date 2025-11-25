# Code Review: Sonarr-ReConnect

## Overview
The extension is a Manifest V3 Chrome extension that interfaces with a Sonarr instance. It uses a background service worker for periodic updates and a popup for the UI.

## Key Findings

### 1. Architecture & MV3 Migration
- **Service Worker Keep-Alive**: The extension uses an `offscreen` document to keep the service worker alive.
  - **Issue**: `background.js` defines `self.onmessage = e => {};` but does not actually process the `keepAlive` message sent by `offscreen.js`. While the event itself might wake the SW, it's better to explicitly handle it or return a response.
  - **Recommendation**: Implement a proper handshake or rely on `chrome.alarms` which is already being used. The `offscreen` approach might be redundant if `alarms` are working correctly for the fetch interval.
- **Storage**: The app mixes `chrome.storage.sync` (for settings) and `localStorage` (for data caching).
  - **Recommendation**: Standardize on `chrome.storage.local` for data caching to avoid synchronous blocking calls and to align with extension best practices.

### 2. Code Quality & Modernization
- **jQuery Usage**: The project relies heavily on jQuery (`$`).
  - **Recommendation**: Modern Vanilla JS (ES6+) is sufficient for this complexity and would reduce bundle size and overhead.
- **Variable Declarations**: `var` is used exclusively.
  - **Recommendation**: Switch to `const` and `let` to avoid hoisting issues and improve scoping.
- **Global Scope Pollution**: Objects like `sonarr`, `app`, `create`, `getSeries`, etc., are all in the global scope.
  - **Recommendation**: Use ES modules or an IIFE (Immediately Invoked Function Expression) to encapsulate logic.
- **Incorrect `delete` Usage**: The code frequently uses `delete variableName` (e.g., `delete historyList`). In JS, `delete` is for object properties. Deleting a variable is a no-op (or throws in strict mode).
  - **Recommendation**: Let variables go out of scope naturally or set them to `null` if memory management is a specific concern (though unlikely needed here).

### 3. Security
- **XSS Risks**: The code constructs HTML strings using data from the API and inserts them using `.html()`.
  - **Risk**: If the Sonarr instance returns malicious data (e.g., a series title with `<script>`), it could execute code.
  - **Recommendation**: Use `textContent` (or jQuery's `.text()`) for text content, or use a sanitization library. Avoid string concatenation for HTML construction.

### 4. Bugs & Logic Issues
- **URL Construction**: The service worker builds URLs without ensuring a trailing slash on the base URL. `http://localhost:8989` becomes `http://localhost:8989api/v3/...`, causing fetches to fail.
- **Episode Endpoint Typo**: The episode PUT endpoint contains an escaped placeholder `api/v3/episode/\{episodeId}`, which prevents proper ID replacement.
- **Badge Logic**: The badge logic `this.settings.showBadge === "true" || parseInt(text, 10) > 0` is flawed. The `||` operator causes the badge to show whenever there are missing episodes, ignoring the user's "Show Badge" preference.
- **`setSeasonData` Error**: This function references an undefined `callback` and tries to use a `season` mode that doesn't exist in settings.
- **`prepLocalStorage`**: Sets items to the string `"undefined"` (`localStorage.setItem('wanted', undefined)` results in `"undefined"` string).
  - **Fix**: Check for null/undefined properly.
- **Error Handling**: `fetchData` in `background.js` catches errors but only logs them.

### 5. UI/UX
- **Templates**: The HTML uses hidden divs as templates (`.templates`).
  - **Recommendation**: The `<template>` tag is the standard HTML5 way to do this.

## Next Steps
1.  **Refactor to ES6+**: Replace `var` with `const/let`, use arrow functions, and modules.
2.  **Remove jQuery**: Rewrite DOM manipulation in Vanilla JS.
3.  **Fix Security**: Sanitize inputs and avoid `innerHTML`.
4.  **Standardize Storage**: Use `chrome.storage` for everything.
