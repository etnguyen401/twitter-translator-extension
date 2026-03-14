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
                                    //createTranslatedNode(langDiv);
                                    createTranslatedNode2(langDiv);
                                }
                                //if the show more text was clicked and there already is translated text, remake the translated node with all text
                                else if (node.getAttribute("data-testid") === "tweet-text-show-more-link"
                                        && mutation.target.querySelector(".translated-text")) {
                                        const langDiv = mutation.target.querySelector("div[lang]");
                                        mutation.target.querySelector(".translated-text").remove();
                                        //createTranslatedNode(langDiv, true);
                                        createTranslatedNode2(langDiv, true);
                                }
                            });
                        }
                    }
                }
                //targetNode loaded already, so translate for existing nodes if needed:
                targetNode.querySelectorAll("div[lang]").forEach((node) => {
                    if (node.querySelector(".translated-text")) return;
                    // createTranslatedNode(node);
                    createTranslatedNode2(node);
                    // test(node);
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

async function createTranslatedNode(langDiv, isShowMore = false) {
    //check if that div's lang is not in nativeLangs
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {

        if (langDiv.textContent.length > 0) {
            try {
                //check cache, if not in cache, send message to background to translate, then add to cache
                const key = createHash(langDiv.textContent.substring(0, 100)); 
                const cachedTranslation = translationCache.get(key);
                const span = document.createElement("span");
                span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3", "translated-text");
                
                const start = performance.now();
                //if it's cached and not a show more translation, use cached translation
                if (cachedTranslation && !isShowMore) {
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

async function createTranslatedNode2(langDiv, isShowMore = false) {
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {
        //get extracted text
        try {
            const { textToTranslate, specialNodesInfo } = extractText(langDiv);
            const textToTranslateJoined = textToTranslate.join("");
            console.log("Text to translate: ", textToTranslate);

            console.log("Special nodes info: ", specialNodesInfo);
            //make cache key and check cache

            const key = createHash(textToTranslateJoined.substring(0, 100));
            let translatedText = translationCache.get(key);

            //create span
            const span = document.createElement("span");
            span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3", "translated-text");
            span.textContent = `\n\nTranslation:\n`;
            // const start = performance.now();

            if (!translatedText || isShowMore) {
                //call api to get list of translations
                const response = await chrome.runtime.sendMessage({
                    type: MESSAGE_TYPES.TRANSLATE_TEXT,
                    text: textToTranslate,
                    source: langDiv.getAttribute("lang"),
                    target: targetLanguage,
                });

                if (response.success) {
                    translatedText = response.translatedText;
                    console.log("Translated text after API call:", translatedText);
                    //add to cache
                    translationCache.set(key, translatedText);
                }
                else {
                    span.textContent = `\n\nTranslation:\nError ${response.status}: ${response.error}\nExecution time in seconds: ${(performance.now() - start) / 1000}`;
                    langDiv.appendChild(span);
                    return;
                }
            }

            console.log("Translated text: ", translatedText);
            //loop over array of translated text
            for (let i = 0; i < translatedText.length; i++) {
                // Handle special nodes
                if (specialNodesInfo.has(i)) {
                    console.log("Handling special node at index: ", i);
                    const info = specialNodesInfo.get(i);
                    //if it's a IMG, just add the html to our span element
                    if (info.type === "img") {
                        console.log("Adding image node: ", info.html);
                        span.insertAdjacentHTML("beforeend", info.html);
                    }
                    else if (info.type === "link") {
                        console.log("Adding link node: ", info.html);
                        //if it's a link, we need to replace the text in the html with the translated text, then add to our span element
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = info.html;
                        const linkNode = tempDiv.firstElementChild;
                        linkNode.firstChild.nodeValue = translatedText[i];
                        span.append(linkNode);
                    }
                }
                else {
                    console.log("Adding regular text: ", translatedText[i]);
                    span.append(translatedText[i]);
                }
            }
            langDiv.appendChild(span);
        } catch (error) {
            console.error("Error during translation node creation:", error);
        }
        
    }
}
function extractText(div) {
    let textToTranslate = [];
    // const subIndex = 0;
    const specialNodesInfo = new Map();

    function dfs(node) {

        if (node.nodeType === Node.TEXT_NODE) {
            textToTranslate.push(node.textContent);
            return;
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            //if span w/ a link
            if (node.classList.contains("r-18u37iz")) {
                const linkNode = node.querySelector("a");

                if (linkNode) {
                    // const sub = `[[__LINK${subIndex}__]]`;
                    textToTranslate.push(linkNode.textContent);
                    //store index
                    const specialNodeInfo = {
                        // sub: sub,
                        html: linkNode.outerHTML,
                        text: linkNode.textContent,
                        type: "link"
                    };
                    specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
                    //if linkNode has more than 1 child, it has text and img
                    // if (linkNode.childNodes.length > 1) {
                    //     specialNodeInfo
                    // }
                    return;
                }
            }
            //if img link, it's an emoji
            else if (node.tagName === "IMG") {
                // if (node.alt) {
                //     textToTranslate.push(node.alt);
                // }
                textToTranslate.push("");
                const specialNodeInfo = {
                    html: node.outerHTML,
                    type: "img"
                };
                specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
                return;
            }   

            Array.from(node.childNodes).forEach(child => {
                dfs(child);
            });
        }

    }

    //start dfs
    Array.from(div.childNodes).forEach(child => {
        dfs(child);
    });

    return {
        textToTranslate, 
        specialNodesInfo
    };
}

function test(tweetTextContainer) {
    // const tweetTextContainer = document.querySelector('[data-testid="tweetText"]');
    // console.log("Tweet text container: ", tweetTextContainer);
    // console.log("hi");
    const { textToTranslate, specialNodesInfo } = extractText(tweetTextContainer);
    console.log("Text to translate: ", textToTranslate);
    console.log("Special nodes info: ", specialNodesInfo);
    console.log("Reconstructed text: ", textToTranslate.join(""));
}

// document.addEventListener("DOMContentLoaded", () => {
//     test();
// });