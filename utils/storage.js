import { DEFAULT_PREFERENCES } from "./constants.js";

export const Storage = {
    async get(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(key, (data) => {
                resolve(data[key] ?? DEFAULT_PREFERENCES[key]);
            })
        });
    },

    async getAll() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (data) => {
                resolve(data ?? DEFAULT_PREFERENCES);
            })
        })
    },

    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ [key]: value }, resolve);
        });
    },

    async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.remove(key, resolve);
        });
    }
};