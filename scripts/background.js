// import { translate } from '@vitalets/google-translate-api';

// const { text } = await translate('Привет мир');

// console.log(text);

//function to create a hash
function createHash(str) {
    let hash = 0;
    for (const char of str) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

class LRUCache {

    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    set(key, val) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        this.cache.set(key, val);

        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clear() {
        this.cache.clear();
    }
    
}

//create cache
const translationCache = new LRUCache(1000);

import { MESSAGE_TYPES } from "../utils/constants.js";
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.tabs.sendMessage(tabId, {
            url: tab.url,
            type: MESSAGE_TYPES.URL_CHANGE
        });
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === MESSAGE_TYPES.TRANSLATE_TEXT) {

        //make key
        const key = createHash(msg.text.join("").substring(0, 100));

        //check if in cache
        let translatedText = translationCache.get(key);

        //if TranslatedText is null, or the user clicked show more, need to fetch translation
        if (!translatedText || msg.isShowMore) {
            (async () => {
                try {
                    const response = await fetch("http://localhost:5000/translate", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            q: msg.text,
                            source: msg.source,
                            target: msg.target,
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        sendResponse({
                            success: false,
                            status: response.status,
                            error: data.error
                        });
                        return;
                    }
                    
                    sendResponse({
                        success: true, 
                        originalText: msg.text, 
                        translatedText: data.translatedText
                    });

                    translationCache.set(key, data.translatedText);

                } catch (error) {
                    console.error("Network Error:", error.message);
                    sendResponse({
                        success: false, 
                        status: "Network/fetch", 
                        error: error.message
                    });
                }
            })();
        }
        else {
            console.log("Cache hit for key: ", key);
            sendResponse({
                success: true,
                originalText: msg.text,
                translatedText: translatedText
            })
        }
        return true;
    }

    
    
    
});
