// import { translate } from '@vitalets/google-translate-api';

// const { text } = await translate('Привет мир');

// console.log(text);
console.log("Background script loaded");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {
            url: tab.url,
            type: 'URL_CHANGE'
        });
    }
});