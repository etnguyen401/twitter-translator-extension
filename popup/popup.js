import { STORAGE_KEYS, MESSAGE_TYPES, targetLanguages, fonts } from "../utils/constants.js";
import { Storage } from "../utils/storage.js";
import { addDropdownLogic } from "./components/dropdownFactory.js";

function reloadTwitterTabs() {
    chrome.tabs.query({currentWindow: true, url: "*://x.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
        });
    });
};

function sendMsgToContentScript(type, data) {
    chrome.tabs.query({currentWindow: true, url: "*://x.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                type: type, 
                ...data
            });
        });
    });
};

//add logic for color picker
async function addColourPickerLogic() {
    
    const textColourInput = document.querySelector("#text-colour-select");
    const colorValueText = document.querySelector(".color-value");

    //load saved colour from storage
    const textColour = await Storage.get(STORAGE_KEYS.TEXT_COLOUR);
    console.log("Saved colour: ", textColour);
    if (textColour) {
        textColourInput.value = textColour;
    } 

    //update color value display on load
    if (colorValueText) {
        colorValueText.textContent = textColourInput.value;
    }

    //update color value display
    textColourInput.addEventListener("input", (e) => {
        const colour = e.target.value;
        if (colorValueText) {
            colorValueText.textContent = colour;
        }
    })

    //save to storage on change
    textColourInput.addEventListener("change", async (e) => {
        const colour = e.target.value;
        await Storage.set(STORAGE_KEYS.TEXT_COLOUR, colour);
        sendMsgToContentScript(MESSAGE_TYPES.COLOUR_CHANGE, { colour });
        // reloadTwitterTabs();
    });

}

document.addEventListener("DOMContentLoaded", () => {
    addDropdownLogic(
        document.querySelector("#target-language-dropdown"),
        {
            items: targetLanguages,
            placeholder: "Select a target language:",
            storageKey: STORAGE_KEYS.TARGET_LANGUAGE,
            onChange: (language) => {
                const langCode = language.slice(-3, -1);
                sendMsgToContentScript(MESSAGE_TYPES.LANGUAGE_CHANGE, { langCode });
            }
        }
    ).init();

    addDropdownLogic(
        document.querySelector("#target-font-dropdown"),
        {
            items: fonts,
            placeholder: "Select a target font:",
            storageKey: STORAGE_KEYS.TARGET_FONT,
            onChange: (font) => {
                sendMsgToContentScript(MESSAGE_TYPES.FONT_CHANGE, { font });
            }
        }
    ).init();

    addColourPickerLogic();
});


