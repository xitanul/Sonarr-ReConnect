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
  // getOptions removed, using Settings.get() in init and alarms
  fetchDataPeriodically: function () {
    chrome.alarms.create("fetchData", { periodInMinutes: Number(this.settings.backgroundInterval) });
  },
  listenForAlarms: function () {
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === "fetchData") {
        this.settings = await Settings.get();
        this.fetchData();
      }
    });
  },
  listenForStorageChanges: function () {
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'local' && (changes.url || changes.apiKey || changes.wantedItems || changes.showBadge)) {
        this.settings = await Settings.get();
        this.fetchData();
      }
    });
  },
  fetchData: async function () {
    const baseUrl = normalizeBaseUrl(this.settings.url);
    const apikey = this.settings.apiKey;
    const wantedItems = this.settings.wantedItems;
    const url = `${baseUrl}api/v3/wanted/missing?page=1&pageSize=${wantedItems}&sortKey=airDateUtc&sortDir=desc&includeSeries=true`;
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
      chrome.action.setBadgeBackgroundColor({ color: '#0000FF' }); // Reset to default blue (or whatever default is preferred, usually browser default is blue-ish but explicit is safer if we change it elsewhere)
      // Actually, standard behavior is to just clear it if we want default, but we might want a specific color.
      // Let's just remove the red background by setting it to null or a default color.
      // Chrome default is usually blue. Let's strictly follow the plan: "reset the badge background color on recovery"
      chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] }); // Transparent/Default
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
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
};

// Offscreen document removed in favor of chrome.alarms

background.init();
