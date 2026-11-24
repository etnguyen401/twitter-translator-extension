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

const prevURLMap = new Map();
const ignoredPathPrefixes = [
    "/compose/post",
    "/messages/compose",
    "/i/verified-get-verified",
    "/i/safety/report_story_start"
]

function isIgnoredPath(pathname) {
    return ignoredPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getBaseURL(rawURL, prevURL) {
    try {
        const url = new URL(rawURL);

        //check if pathname starts with any of the ignored pathnames
        if (isIgnoredPath(url.pathname)) {
            console.log("Ignoring URL due to ignored path prefix:", rawURL);
            return null;
        }

        const checkAnalytics = /\/status\/(\d+)\/analytics(\/.*)?$/.test(url.pathname);
        //if it's analytics, check if prev URL was media, if it is, we need to retarget
        //else, return the prev URL, since we don't want to retarget to the analytics page 
        //if the user is not coming from media
        if (checkAnalytics) {
            if (prevURL && prevURL.endsWith("/media")) {
                console.log("Retargeting analytics URL to media since prev URL is media:", rawURL);
                return rawURL;
            }
            else {
                console.log("Ignoring analytics URL since prev URL is not media:", rawURL);
                return null;
            }
        }

        //adjust the URL if the URL is a photo / video album is being opened
        let newPath = url.pathname.replace(
            /\/status\/(\d+)\/(photo|video)(\/.*)?$/,
            "/status/$1/media"
        );
        
        return `${url.origin}${newPath}${url.search}`;
            
    }
    catch {
        return null;
    }
}

function sendURLChangeMessage(tabId) {
    chrome.tabs.sendMessage(
        tabId,
        {
            type: MESSAGE_TYPES.URL_CHANGE,
        }, 
        () => {
            if (chrome.runtime.lastError) {
                console.log('Could not send URL_CHANGE msg to tab', tabId, ':', chrome.runtime.lastError.message);
            } else {
                console.log('URL_CHANGE sent successfully to tab', tabId);
            }
        }
    );
}

function notifyTab(tabId, url) {
    if (!url) return;

    const prevURL = prevURLMap.get(tabId);

    const baseURL = getBaseURL(url, prevURL);

    if (!baseURL) return;
    
    if (prevURL === baseURL) {
        console.log("No URL change detected for tabId:", tabId, "URL:", url);
        return;
    }
    else {
        console.log("Detected URL change for tabId:", tabId, "New URL:", url);
        prevURLMap.set(tabId, baseURL);
        sendURLChangeMessage(tabId);
    }
}

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return; 
    console.log("Detected onHistoryStateUpdated change for tabId:", details.tabId, "New URL:", details.url);
    if (details.url) {
        notifyTab(details.tabId, details.url);
    }
    else {
        console.log("No URL found in details for onHistoryStateUpdated change:", details.tabId);
    }
});

//cleanup 
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (prevURLMap.has(tabId)) {
        prevURLMap.delete(tabId);
        console.log("Removed tabId from prevURLMap:", tabId);
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
            sendResponse({
                success: true,
                originalText: msg.text,
                translatedText: translatedText
            });
        }
        return true;
    }
});

