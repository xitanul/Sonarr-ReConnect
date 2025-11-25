export const Settings = {
    defaults: {
        apiKey: '',
        url: 'http://localhost:8989',
        numberOfDaysCalendar: 7,
        wantedItems: 15,
        historyItems: 15,
        calendarEndDate: 7,
        backgroundInterval: 5,
        sonarrConfig: {},
        showBadge: false
    },

    get() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(this.defaults, resolve);
        });
    },

    set(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(settings, resolve);
        });
    }
};
