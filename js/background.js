importScripts('utils.js', 'settings.js');

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
    const url = `${baseUrl}api/v3/wanted/missing?page=1&pageSize=${wantedItems}&sortKey=airDateUtc&sortDir=desc&includeSeries=true&apikey=${apikey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const numMissingEpisodes = data.totalRecords;
      this.updateBadge(numMissingEpisodes.toString());
    } catch (error) {
      console.error('Fetch error:', error);
    }
  },
  updateBadge: function (text) {
    if (text && (this.settings.showBadge === "true" || parseInt(text, 10) > 0)) {
      chrome.action.setBadgeText({ text: text.toString() });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
};

// Offscreen document removed in favor of chrome.alarms

background.init();
