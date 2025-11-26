export const Storage = {
    get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
                resolve(result[key] !== undefined ? result[key] : null);
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
        // Check if localStorage is available (not available in service workers)
        if (typeof localStorage === 'undefined') {
            console.log('localStorage not available in this context, skipping migration');
            return;
        }

        const keys = ['wanted', 'calendar', 'history', 'series'];
        for (const key of keys) {
            try {
                const value = localStorage.getItem(key);
                if (value && value !== 'undefined') {
                    await this.set(key, JSON.parse(value));
                    localStorage.removeItem(key);
                    console.log(`Migrated ${key} to chrome.storage.local`);
                }
            } catch (e) {
                console.error('Migration failed for', key, e);
            }
        }
    }
};
