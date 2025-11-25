const Storage = {
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
    }
};
