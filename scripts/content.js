import { STORAGE_KEYS, MESSAGE_TYPES } from "../utils/constants.js";
import { Storage } from "../utils/storage.js";

let nativeLangs = ["cy", "art", "in", "ht", "und", "qam", "qct", "qht", "qme", "qmn", "qmx", "qmv", "qmw", "qmx", "qst", "zxx"];
let settings = null;
let targetLanguage = null;

(async () => {
    const settings = await Storage.getAll();
    console.log("Loaded settings: ", settings);

    targetLanguage = settings.targetLanguage.slice(-3, -1);
    nativeLangs.push(targetLanguage);

    //apply colour
    applyTextColour(settings.textColour);

    //add style for hovering over links
    const style = document.createElement("style");
    style.innerHTML = `
    .translated-text a:hover {
        text-decoration: underline !important;
    }`;
    document.head.appendChild(style);
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

    if (colour === "") {
        return;
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
                                        createTranslatedNode(langDiv, true);
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

async function createTranslatedNode(langDiv, isShowMore = false) {
    if (langDiv && !nativeLangs.includes(langDiv.getAttribute("lang"))) {
        //get extracted text
        try {
            const { textToTranslate, specialNodesInfo } = extractText(langDiv);

            //create span
            const span = document.createElement("span");
            span.classList.add("css-1jxf684", "r-bcqeeo", "r-1ttztb7", "r-qvutc0", "r-poiln3", "translated-text");
            span.textContent = `\n\nTranslation:\n`;
            
            const response = await chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.TRANSLATE_TEXT,
                text: textToTranslate,
                isShowMore: isShowMore,
                source: langDiv.getAttribute("lang"),
                target: targetLanguage,
            });
            

            if (!response.success) {
                span.textContent = `\n\nTranslation:\nError ${response.status}: ${response.error}`;
                langDiv.appendChild(span);
                return;
            }

            //loop over array of translated text
            for (let i = 0; i < response.translatedText.length; i++) {
                // Handle special nodes
                if (specialNodesInfo.has(i)) {

                    const info = specialNodesInfo.get(i);
                    //if it's a IMG, just add the html to our span element
                    if (info.type === "img" || info.type === "spacing") {
                        // console.log("Adding img/spacing node: ", info.html);
                        span.insertAdjacentHTML("beforeend", info.html);
                    }
                    else if (info.type === "link" || info.type === "text") {
                        //if it's a link, we need to replace the text in the html with the translated text, then add to our span element
                        //link: tempdiv -> span -> a -> text node
                        //text: tempdiv -> span -> text
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = info.html;
                        let node = null;
                        if (info.type === "link") {
                            node = tempDiv.firstElementChild.firstElementChild;
                            //if the hashtag is missing, add it to the front
                            if (!response.translatedText[i].startsWith("#")) {
                                response.translatedText[i] = "#" + response.translatedText[i];
                            }
                            //if the translated text is too short, set the text to the original
                            if (info.text.length * 0.3 > response.translatedText[i].length) {
                                response.translatedText[i] = info.text;
                            }
                        }
                        else if (info.type === "text") {
                            node = tempDiv.firstElementChild;
                        }
                        node.firstChild.nodeValue = response.translatedText[i];
                        span.append(node);
                    }
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

        if (node.nodeType === Node.ELEMENT_NODE) {
            //if span w/ a link
            if (node.classList.contains("r-18u37iz")) {
                const linkNode = node.querySelector("a");
                if (linkNode) {
                    textToTranslate.push(linkNode.textContent);

                    //store index
                    const specialNodeInfo = {
                        html: node.outerHTML,
                        text: linkNode.textContent,
                        type: "link"
                    };

                    specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
                    return;
                }
            }
            //if img link, it's an emoji
            else if (node.tagName === "IMG") {

                textToTranslate.push("");
                const specialNodeInfo = {
                    html: node.outerHTML,
                    type: "img"
                };
                specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
                return;
            }
            //if span has no text content, it's for spacing
            else if (node.textContent.trim() === "") {
                textToTranslate.push(node.textContent);
                const specialNodeInfo = {
                    html: node.outerHTML,
                    type: "spacing"
                };
                specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
                return;
            }
            //if it's a span with text content,
            //link to website/something else,
            //@mention as well
            else {
                textToTranslate.push(node.textContent);
                const specialNodeInfo = {
                    html: node.outerHTML,
                    type: "text"
                };
                specialNodesInfo.set(textToTranslate.length - 1, specialNodeInfo);
            }
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
