/**
 * 
 * @author C.Vaes
 */


/**
* Check if url ends with a /
*/
/**
* Check if url ends with a /
*/
import { normalizeBaseUrl } from './utils.js';
import { Settings } from './settings.js';

// checkUrl function removed, using normalizeBaseUrl from utils.js

//empty sonarrConfig object
let sonarrConfig = {};

/**
 * Test connection to sonarr server with api key. api/system/status call is used
 */
async function test_connection() {
  const apiKey = document.getElementById('apiKey').value;
  const url = normalizeBaseUrl(document.getElementById('url').value);
  document.getElementById('url').value = url;
  const status = document.getElementById('connectionStatus');

  status.textContent = 'Connecting to ' + url;
  status.style.color = '';

  try {
    const response = await fetch(url + 'api/v3/system/status', {
      headers: {
        'X-Api-Key': apiKey
      }
    });
    if (response.status === 401) {
      status.textContent = 'Authentication failed: Invalid API key';
      status.style.color = 'red';
      return;
    }
    if (!response.ok) {
      status.textContent = `Connection failed: Server returned ${response.status} ${response.statusText}`;
      status.style.color = 'red';
      return;
    }
    const data = await response.json();
    status.textContent = `✓ Connected successfully to Sonarr v${data.version}`;
    status.style.color = 'green';
    getInstallationInformation(data);
    sonarrConfig = data;
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      status.textContent = 'Connection failed: Unable to reach Sonarr server at ' + url;
    } else {
      status.textContent = 'Connection failed: ' + error.message;
    }
    status.style.color = 'red';
    console.error('[Options] Connection test failed:', error);
  }
}

function getInstallationInformation(data) {
  document.getElementById('version').textContent = data.version;
  document.getElementById('branch').textContent = data.branch;
}


/**
 * Save settings to chrome storage
 */
function save_options() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const url = normalizeBaseUrl(document.getElementById('url').value.trim());
  const numberOfDaysCalendar = document.getElementById('numberOfDaysCalendar').value;
  const wantedItems = document.getElementById('wantedItems').value;
  const historyItems = document.getElementById('historyItems').value;
  const backgroundInterval = document.getElementById('backgroundInterval').value;
  let showBadge = document.getElementById('show-badge').checked;
  if (showBadge === undefined) {
    showBadge = false;
  }

  const status = document.getElementById('status');

  // Input validation
  const errors = [];

  if (!apiKey) {
    errors.push('API Key is required');
  }

  if (!url || url.length < 10) {
    errors.push('Valid Sonarr URL is required');
  }

  const numDays = parseInt(numberOfDaysCalendar, 10);
  if (isNaN(numDays) || numDays < 1 || numDays > 365) {
    errors.push('Calendar days must be between 1 and 365');
  }

  const numWanted = parseInt(wantedItems, 10);
  if (isNaN(numWanted) || numWanted < 1 || numWanted > 100) {
    errors.push('Wanted items must be between 1 and 100');
  }

  const numHistory = parseInt(historyItems, 10);
  if (isNaN(numHistory) || numHistory < 1 || numHistory > 100) {
    errors.push('History items must be between 1 and 100');
  }

  const interval = parseInt(backgroundInterval, 10);
  if (isNaN(interval) || interval < 1 || interval > 1440) {
    errors.push('Background interval must be between 1 and 1440 minutes (24 hours)');
  }

  // Display errors if any
  if (errors.length > 0) {
    status.textContent = 'Validation errors: ' + errors.join(', ');
    status.style.color = 'red';
    setTimeout(() => {
      status.textContent = '';
      status.style.color = '';
    }, 5000);
    return;
  }

  Settings.set({
    apiKey: apiKey,
    url: url,
    numberOfDaysCalendar: numDays,
    wantedItems: numWanted,
    historyItems: numHistory,
    backgroundInterval: interval,
    sonarrConfig: sonarrConfig,
    showBadge: showBadge,
  }).then(() => {
    chrome.alarms.clear("fetchData", function () {
      chrome.alarms.create("fetchData", { periodInMinutes: Number(backgroundInterval) });
      console.log(`[Options] Alarm "fetchData" updated to interval: ${backgroundInterval} minutes`);
    });
    // Update status to let user know options were saved.
    status.textContent = 'Options saved.';
    status.style.color = 'green';
    setTimeout(() => {
      status.textContent = '';
      status.style.color = '';
    }, 750);
  });
}

/**
 * Restore settings from chrome storage
 */
function restore_options() {
  // Use default value apiKey = '' and url = https://localhost.
  Settings.get().then((items) => {
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('url').value = items.url;
    document.getElementById('numberOfDaysCalendar').value = items.numberOfDaysCalendar;

    document.getElementById('wantedItems').value = items.wantedItems;
    document.getElementById('historyItems').value = items.historyItems;
    document.getElementById('backgroundInterval').value = items.backgroundInterval;
    if (items.showBadge) {
      document.getElementById("show-badge").checked = true;
    }
  });

  document.getElementById('versionNumber').appendChild(document.createTextNode(chrome.runtime.getManifest().version));
}

// add listeners to buttons
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('testConnection').addEventListener('click', test_connection);