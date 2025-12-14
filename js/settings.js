/**
 * Settings manager that splits storage between sync and local
 * - Synced: URL, intervals, preferences (syncs across devices)
 * - Local: API key (stays on device for security)
 */
export const Settings = {
    defaults: {
        // Synced settings
        url: 'http://localhost:8989',
        numberOfDaysCalendar: 7,
        wantedItems: 15,
        historyItems: 15,
        backgroundInterval: 5,
        sonarrConfig: {},
        showBadge: true,

        // Local-only settings
        apiKey: ''
    },

    /**
     * Get all settings (merged from sync + local)
     */
    async get() {
        const [syncData, localData] = await Promise.all([
            new Promise(resolve => chrome.storage.sync.get(this.defaults, resolve)),
            new Promise(resolve => chrome.storage.local.get({ apiKey: this.defaults.apiKey }, resolve))
        ]);

        // Merge: local apiKey overrides sync apiKey (for migration)
        return { ...syncData, apiKey: localData.apiKey || syncData.apiKey || this.defaults.apiKey };
    },

    /**
     * Save settings (splits between sync and local)
     * @param {Object} settings - Settings object
     */
    async set(settings) {
        const { apiKey, ...syncSettings } = settings;

        const promises = [];

        // Save sync settings
        if (Object.keys(syncSettings).length > 0) {
            promises.push(new Promise(resolve => chrome.storage.sync.set(syncSettings, resolve)));
        }

        // Save API key to local storage
        if (apiKey !== undefined) {
            promises.push(new Promise(resolve => chrome.storage.local.set({ apiKey }, resolve)));
        }

        await Promise.all(promises);

        // Migration: remove apiKey from sync if it exists there
        await this.migrateApiKey();
    },

    /**
     * Migrate API key from sync to local (one-time)
     */
    async migrateApiKey() {
        const syncData = await new Promise(resolve => chrome.storage.sync.get(['apiKey'], resolve));
        if (syncData.apiKey) {
            // Move to local
            await new Promise(resolve => chrome.storage.local.set({ apiKey: syncData.apiKey }, resolve));
            // Remove from sync
            await new Promise(resolve => chrome.storage.sync.remove(['apiKey'], resolve));
            console.log('[Settings] Migrated API key from sync to local storage');
        }
    }
};
