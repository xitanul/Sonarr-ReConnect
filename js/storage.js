export const Storage = {
    get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
                resolve(result[key] || null);
            });
        });
    },

    set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    },

    remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, resolve);
        });
    },

    async migrate() {
        const keys = ['wanted', 'calendar', 'history', 'series'];
        for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value && value !== 'undefined') {
                try {
                    await this.set(key, JSON.parse(value));
                    localStorage.removeItem(key);
                    console.log(`Migrated ${key} to chrome.storage.local`);
                } catch (e) {
                    console.error('Migration failed for', key, e);
                }
            }
        }
    }
};
