// import { translate } from '@vitalets/google-translate-api';

// const { text } = await translate('Привет мир');

// console.log(text);
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
        } catch (error) {
            console.error("Network Error:", error.message);
            sendResponse({
                success: false, 
                status: "Network/fetch", 
                error: error.message
            });
        }
    })();
    
    return true;
});
