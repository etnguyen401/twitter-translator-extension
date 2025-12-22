// import { translate } from '@vitalets/google-translate-api';

// const { text } = await translate('Привет мир');

// console.log(text);
console.log("Background script loaded");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.tabs.sendMessage(tabId, {
            url: tab.url,
            type: "URL_CHANGE"
        });
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type !== "TRANSLATE_TEXT") return;

    (async () => {
        const response = await fetch("http://localhost:5000/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: msg.text,
                source: "auto",
                target: msg.target,
            })
        });
    
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
        } 

        const data = await response.json();
        sendResponse(data);
    })();
    
    return true;
});
