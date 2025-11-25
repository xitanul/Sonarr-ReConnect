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
// checkUrl function removed, using normalizeBaseUrl from utils.js

//empty sonarrConfig object
var sonarrConfig = {};

/**
 * Test connection to sonarr server with api key. api/system/status call is used
 */
function test_connection() {
  var apiKey = document.getElementById('apiKey').value;
  var url = normalizeBaseUrl(document.getElementById('url').value);
  document.getElementById('url').value = url;
  var status = document.getElementById('connectionStatus');

  status.textContent = 'Connecting to ' + url;
  $.ajax({
    url: url + 'api/v3/system/status?apiKey=' + apiKey,
    statusCode: {
      401: function () {
        status.textContent = 'Credentials or url are not correct';
      },
      404: function () {
        status.textContent = 'Sonarr is not running on this address';
      }
    },
    complete: function (data) {
      if (typeof (data.responseJSON) != "undefined") {
        status.textContent = 'Connection successful!';
        getInstallationInformation(data.responseJSON);
        sonarrConfig = data.responseJSON;
      } else {
        status.textContent = 'Credentials or url are not correct';
      }
    }

  });
}

function getInstallationInformation(data) {
  document.getElementById('version').textContent = data.version;
  document.getElementById('branch').textContent = data.branch;
}


/**
 * Save settings to chrome storage
 */
function save_options() {
  var apiKey = document.getElementById('apiKey').value;
  var url = normalizeBaseUrl(document.getElementById('url').value);
  var numberOfDaysCalendar = document.getElementById('numberOfDaysCalendar').value;
  var wantedItems = document.getElementById('wantedItems').value;
  var historyItems = document.getElementById('historyItems').value;
  var backgroundInterval = document.getElementById('backgroundInterval').value;
  var showBadge = $('#show-badge:checked').val();
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
    setTimeout(function () {
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
      $("#show-badge").attr("checked", true);
    }
  });

  document.getElementById('versionNumber').appendChild(document.createTextNode(chrome.runtime.getManifest().version));
}

// add listeners to buttons
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('testConnection').addEventListener('click', test_connection);