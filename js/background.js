import { normalizeBaseUrl } from './utils.js';
import { Settings } from './settings.js';

const background = {
  settings: {},
  init: async function () {
    this.settings = await Settings.get();
    this.fetchDataPeriodically();
    this.listenForAlarms();
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
    } catch (error) {
      console.log('[Background] Fetch error:', error);
      // Set badge to error indicator
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#e74c3c' });
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
