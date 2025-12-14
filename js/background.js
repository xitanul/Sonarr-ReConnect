import { normalizeBaseUrl } from './utils.js';
import { Settings } from './settings.js';

const background = {
  settings: {},
  init: async function () {
    this.settings = await Settings.get();
    this.fetchDataPeriodically();
    this.listenForAlarms();
    this.listenForStorageChanges();
    this.fetchData(); // Initial fetch
  },
  fetchDataPeriodically: function () {
    chrome.alarms.create("fetchData", { periodInMinutes: Number(this.settings.backgroundInterval) });
  },
  listenForAlarms: function () {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === "fetchData") {
        this.settings = await Settings.get();
        await this.fetchData();
      }
    });
  },
  listenForStorageChanges: function () {
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'sync' && (changes.url || changes.apiKey || changes.wantedItems || changes.showBadge)) {
        this.settings = await Settings.get();
        await this.fetchData();
      }
    });
  },
  fetchData: async function () {
    const baseUrl = normalizeBaseUrl(this.settings.url);
    if (!baseUrl) {
      console.log('[Background] No URL configured');
      return;
    }

    const apikey = this.settings.apiKey;
    const wantedItems = this.settings.wantedItems;
    const url = `${baseUrl}api/v3/wanted/missing?page=1&pageSize=${wantedItems}&sortKey=airDateUtc&sortDir=desc&includeSeries=true`;

    // Check permissions first
    let origin;
    try {
      origin = new URL(baseUrl).origin + '/*';
    } catch (e) {
      console.log('[Background] Invalid URL:', baseUrl);
      return;
    }
    const hasPermission = await new Promise(resolve => {
      chrome.permissions.contains({ origins: [origin] }, resolve);
    });

    if (!hasPermission) {
      console.log('[Background] Missing permission for:', origin);
      chrome.action.setBadgeText({ text: 'PERM' });
      chrome.action.setBadgeBackgroundColor({ color: '#e67e22' }); // Orange for warning
      return;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'X-Api-Key': apikey
        }
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const numMissingEpisodes = data.totalRecords;
      this.updateBadge(numMissingEpisodes.toString());
    } catch (error) {
      console.log('[Background] Fetch error:', error);
      // Set badge to error indicator ONLY if showBadge is true
      if (this.settings.showBadge) {
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    }
  },
  updateBadge: function (text) {
    if (this.settings.showBadge && text && parseInt(text, 10) > 0) {
      chrome.action.setBadgeText({ text: text.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#1565C0' }); // keep text visible
    } else {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
    }
  }
};

background.init();
