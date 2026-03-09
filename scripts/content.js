import { STORAGE_KEYS, MESSAGE_TYPES } from "../utils/constants.js";
import { Storage } from "../utils/storage.js";

let nativeLangs = ["cy", "in", "ht", "und", "qam", "qct", "qht", "qme", "qmn", "qmx", "qmv", "qmw", "qmx", "qst", "zxx"];
let settings = null;
let targetLanguage = null;

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

//create cache with max of 500
const translationCache = new LRUCache(500);

(async () => {
    const settings = await Storage.getAll();
    console.log("Loaded settings: ", settings);

    
    targetLanguage = settings.targetLanguage.slice(-3, -1);
    nativeLangs.push(targetLanguage);

    //apply colour
    applyTextColour(settings.textColour);
})();

let targetNode = null;
let observer = null;
let intervalId = null;

window.addEventListener("load", () => {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        switch (msg.type) {
            case MESSAGE_TYPES.URL_CHANGE:
                console.log("URL changed to: " + msg.url);
                initialPageSetup();
                break;         
            case MESSAGE_TYPES.COLOUR_CHANGE:
                console.log("Colour changed to: " + msg.colour);
                applyTextColour(msg.colour);
                break;
            case MESSAGE_TYPES.FONT_CHANGE:
                console.log("Font changed to: " + msg.font);
                applyFont(msg.font);
                break;
            case MESSAGE_TYPES.LANGUAGE_CHANGE:
                console.log("Language changed to: " + msg.langCode);
                //find old language in nativeLangs and remove it
                nativeLangs = nativeLangs.filter((lang) => lang !== targetLanguage);
                targetLanguage = msg.langCode;
                nativeLangs.push(targetLanguage);
                initialPageSetup();
                //clear cache
                translationCache.clear();
                break;
        }
    });
});

function applyFont(font) {
    //remove old font style
    const oldStyle = document.getElementById("translation-text-font");
    if (oldStyle) {
        oldStyle.remove();
    }

    if (font === "Default") {
        return;
    }
    
    //make style element and add css rules for font
    const style = document.createElement("style");
    style.id = "translation-text-font";
    style.textContent = `.translated-text {
        font-family: ${font} !important;
    }`;

    //add to document
    document.head.appendChild(style);
}

function applyTextColour(colour) {
    //remove old colour
    const oldStyle = document.getElementById("translation-text-colour");
    if (oldStyle) {
        oldStyle.remove();
    }

    //make style element and add css rules for tweets
    const style = document.createElement("style");
    style.id = "translation-text-colour";
    style.textContent = `.translated-text {
        color: ${colour} !important;
    }`;

    //add to document
    document.head.appendChild(style);
}

function initialPageSetup() {
    targetNode = null;
    //select until page finished loading, in increments
    //disconnect old observer
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    //clear old translations if they exist
    document.querySelectorAll(".translated-text").forEach(node => node.remove());

    intervalId = setInterval(() => {
        console.log("Inside setInterval")
        if (!targetNode) {
            //grab the section element
            targetNode = document.querySelector('section > div > div[style^="position: relative"]');
            if (targetNode) {
                //get to the right parent node that doesn't disappear on navigation
                targetNode = targetNode.parentElement.parentElement.parentElement;
                console.log("Target Node:", targetNode);
                //make options
                const options = {childList: true, subtree: true};
                //make callback for mutation observer
                const callback = function (mutationList, observer) {
                    //for each mutation, log for now
                    for (const mutation of mutationList) {
                        //if mutation is an added node
                        if (mutation.addedNodes.length > 0) {
                            //for each added node
                            mutation.addedNodes.forEach((node) => {
                                //if the added node has data-testid = cellInnerDiv, it's a new tweet
                                if (node.getAttribute && node.getAttribute("data-testid") === "cellInnerDiv"
                                    && !node.querySelector(".translated-text")) {
                                    //run the translated node creation
                                    const langDiv = node.querySelector("div[lang]");
                                    createTranslatedNode(langDiv);
                                }
                            }); 
                        }
                        //else if mutation is a removed node
                        else if (mutation.removedNodes.length > 0) {
                            //for each removed node
                            mutation.removedNodes.forEach((node) => {
                                //when user clicks show original text 
                                //if the removed node matches <div class="css-175oi2r r-1awozwy r-18u37iz r-z5qs1h r-e683xz r-1s2bzr4">,
                                //which is the "rate this translation" div
                                //remake the translated node as twitter reloads the tweet
                                if (node.classList.contains("r-z5qs1h")) {
                                    const langDiv = mutation.target.querySelector("div[lang]");
                                    createTranslatedNode(langDiv);
                                }
                                //if the show more text was clicked and there already is translated text, remake the translated node with all text
                                else if (node.getAttribute("data-testid") === "tweet-text-show-more-link"
                                        && mutation.target.querySelector(".translated-text")) {
                                        const langDiv = mutation.target.querySelector("div[lang]");
                                        mutation.target.querySelector(".translated-text").remove();
                                        createTranslatedNode(langDiv);
                                }
                            });
                        }
                    }
                }
                //targetNode loaded already, so translate for existing nodes if needed:
                targetNode.querySelectorAll("div[lang]").forEach((node) => {
                    if (node.querySelector(".translated-text")) return;
                    createTranslatedNode(node);
                });
                //create mutation observer, will take over and detect new nodes
                observer = new MutationObserver(callback);

                //start observing
                observer.observe(targetNode, options);
                
                clearInterval(intervalId);
                intervalId = null;
                console.log("Interval cleared");
            }
        }
    }, 600);  
}

async function createTranslatedNode(langDiv) {
    //check if that div's lang is not in nativeLangs
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {

        if (langDiv.textContent.length > 0) {
            try {
                //check cache, if not in cache, send message to background to translate, then add to cache
                const key = createHash(langDiv.textContent.substring(0, 100)); 

                const span = document.createElement("span");
                span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3", "translated-text");
                
                const start = performance.now();

                if (cachedTranslation) {
                    console.log("Translation from cache for: ", langDiv.textContent.substring(0, 100));
                    console.log("Cached translation: ", cachedTranslation);
                    span.textContent = `\n\nTranslation:\n${cachedTranslation}\nExecution time in seconds: ${(performance.now() - start) / 1000}`;

                }
                else {
                    const response = await chrome.runtime.sendMessage({
                        type: MESSAGE_TYPES.TRANSLATE_TEXT,
                        text: langDiv.textContent,
                        source: langDiv.getAttribute("lang"),
                        target: targetLanguage,
                    });

                    if (response.success) {
                        span.textContent = `\n\nTranslation:\n${response.translatedText}\nExecution time in seconds: ${(performance.now() - start) / 1000}`;
                        //add to cache
                        translationCache.set(key, response.translatedText);
                    }
                    else {
                        span.textContent = `\n\nTranslation:\nError ${response.status}: ${response.error}\nExecution time in seconds: ${(performance.now() - start) / 1000}`;
                    }
                    
                }
                langDiv.appendChild(span);


            } catch (error) {
                console.error("Error during translation node creation:", error);
            }
        }
    }
}