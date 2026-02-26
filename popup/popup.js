function reloadTwitterTabs() {
    chrome.tabs.query({currentWindow: true, url: "*://x.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
        });
    });
};

//add logic for color picker
async function addColourPickerLogic() {
    
    const textColourInput = document.querySelector("#text-colour-select");
    //load saved colour from storage
    const savedColour = await Storage.get(STORAGE_KEYS.TEXT_COLOUR);
    console.log("Saved colour: ", savedColour);
    if (savedColour) {
        textColourInput.value = savedColour;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    addDropdownLogic(
        document.querySelector("#target-language-dropdown"),
        {
            items: targetLanguages,
            placeholder: "Select a target language:",
            storageKey: STORAGE_KEYS.TARGET_LANGUAGE,
            onChange: reloadTwitterTabs
        }
    ).init();

    addColourPickerLogic();
});


