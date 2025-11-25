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

  try {
    const response = await fetch(url + 'api/v3/system/status', {
      headers: {
        'X-Api-Key': apiKey
      }
    });
    if (response.status === 401) {
      status.textContent = 'Credentials or url are not correct';
      return;
    }
    if (!response.ok) {
      status.textContent = 'Sonarr is not running on this address';
      return;
    }
    const data = await response.json();
    status.textContent = 'Connection successful!';
    getInstallationInformation(data);
    sonarrConfig = data;
  } catch (error) {
    status.textContent = 'Sonarr is not running on this address';
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
  const apiKey = document.getElementById('apiKey').value;
  const url = normalizeBaseUrl(document.getElementById('url').value);
  const numberOfDaysCalendar = document.getElementById('numberOfDaysCalendar').value;
  const wantedItems = document.getElementById('wantedItems').value;
  const historyItems = document.getElementById('historyItems').value;
  const backgroundInterval = document.getElementById('backgroundInterval').value;
  let showBadge = document.getElementById('show-badge').checked;
  if (showBadge == undefined)
    showBadge = false;

  console.log(showBadge)

  Settings.set({
    apiKey: apiKey,
    url: url,
    numberOfDaysCalendar: numberOfDaysCalendar,
    wantedItems: wantedItems,
    historyItems: historyItems,
    backgroundInterval: backgroundInterval,
    sonarrConfig: sonarrConfig,
    showBadge: showBadge,
  }).then(() => {
    chrome.alarms.clear("fetchData", function () {
      chrome.alarms.create("fetchData", { periodInMinutes: Number(backgroundInterval) });
      console.log(`Alarm "fetchData" updated to new interval: ${backgroundInterval} minutes.`);
    });
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
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
    console.log(items);
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