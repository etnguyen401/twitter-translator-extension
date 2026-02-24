function reloadTwitterTabs() {
    chrome.tabs.query({currentWindow: true, url: "*://x.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
        });
    });
};

const targetLanguageDropdown = addDropdownLogic(
    document.querySelector("#target-language-dropdown"),
    {
        items: targetLanguages,
        placeholder: "Select a target language:",
        storageKey: STORAGE_KEYS.TARGET_LANGUAGE,
        onChange: reloadTwitterTabs
    }
);

targetLanguageDropdown.init();
