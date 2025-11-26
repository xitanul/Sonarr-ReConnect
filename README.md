# Sonarr ReConnect

The extension gives the ability to show Sonarr activities like: History, Wanted/Missing, upcoming shows and an overview of all your shows with status straight in Google Chrome. It also shows a badge in your Chrome browser which shows how many episodes are wanted/missing. So you know when to take action without checking Sonarr very often.

## Features

*   **Calendar**: View upcoming episodes (Today, Tomorrow, Later) and missing episodes.
*   **Series Overview**: Browse all your series with status indicators (Continuing/Ended) and episode counts.
*   **History**: See recent activity (Imported, Grabbed, Failed).
*   **Monitor Toggle**: Quickly toggle monitoring status for individual episodes directly from the extension.
*   **Quick Navigation**: Jump to series details from any view.
*   **Badge Notifications**: See the count of wanted/missing episodes on the extension icon.

## What's New in v3.0.0

### Architecture & Refactoring
*   **jQuery Removal**: Completely removed jQuery dependency, rewriting all DOM manipulation and AJAX calls using native Vanilla JS and Fetch API.
*   **Modular Codebase**: Refactored the monolithic `popup.js` into a modern, modular architecture using ES Modules (`modules/sonarr-api.js`, `modules/ui.js`, etc.) for better maintainability.

### UI Polish & Enhancements
*   **Visual Fidelity**: Restored original design aesthetics with precise padding, alignment, and font sizing in Calendar and History views.
*   **History View**: Optimized layout to prevent text wrapping and ensure consistent single-line display for all items.
*   **Calendar View**: Improved spacing and alignment for better readability.

### Fixes & Improvements
*   **Badge Behavior**: Fixed badge error handling to respect user settings and enabled it by default.
*   **Permissions**: Added necessary host permissions to ensure reliable connectivity with Sonarr instances.
*   **Performance**: Added initial fetch on load to show data immediately without waiting for the first background interval.
*   **List Visibility**: Fixed an issue where the last series in the list was cut off by the bottom menu.

## Setup

1.  **Install**:
    *   Clone this repository.
    *   Open Chrome and go to `chrome://extensions/`.
    *   Enable "Developer mode".
    *   Click "Load unpacked" and select the extension directory.
2.  **Configure**:
    *   Right-click the extension icon and select "Options".
    *   Enter your Sonarr URL (e.g., `http://localhost:8989`) and API Key.
    *   Click "Save".
3.  **Use**:
    *   Click the extension icon to view your Sonarr data.
